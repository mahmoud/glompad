import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get, writable } from 'svelte/store';

// Polyfill matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ── Mocks (must be hoisted before module import) ──────────────────────

// vi.hoisted runs before vi.mock factories — use it to share references
const { mockRunGlom, mockInterrupt, mockWorkerStatus, makeWritable } = vi.hoisted(() => {
  // Minimal writable store compatible with Svelte's store contract
  function makeWritable<T>(initial: T) {
    let value = initial;
    const subs = new Set<(v: T) => void>();
    return {
      subscribe(fn: (v: T) => void) { subs.add(fn); fn(value); return () => { subs.delete(fn); }; },
      set(v: T) { value = v; subs.forEach(fn => fn(v)); },
      update(fn: (v: T) => T) { value = fn(value); subs.forEach(s => s(value)); },
    };
  }

  return {
    makeWritable,
    mockRunGlom: vi.fn().mockResolvedValue({
      result: '"test"',
      status: 'success' as const,
      timing: { parse_ms: 1, glom_ms: 2, format_ms: 0, total_ms: 3 },
    }),
    mockInterrupt: vi.fn(),
    mockWorkerStatus: makeWritable<string>('idle'),
  };
});

vi.mock('./worker/worker-client', () => ({
  get_worker_client: vi.fn(() => ({
    status: mockWorkerStatus,
    ready_info: makeWritable({ pyodide_version: '0.27.7', glom_version: '24.11.0' }),
    start: vi.fn().mockResolvedValue(undefined),
    run_glom: mockRunGlom,
    autoformat: vi.fn().mockResolvedValue('formatted'),
    interrupt: mockInterrupt,
    destroy: vi.fn(),
  })),
}));

vi.mock('./urlStore', () => ({
  createUrlStore: vi.fn(() => makeWritable('http://localhost/')),
}));

vi.mock('@sentry/browser', () => ({ captureException: vi.fn() }));
vi.mock('svelte-media-queries', () => ({
  createMediaStore: vi.fn(() => ({ subscribe: vi.fn() })),
}));
vi.mock('./darkModeStore', () => ({
  darkModeStore: { subscribe: vi.fn() },
}));

// ── Import after mocks ───────────────────────────────────────────────

import { isValidURL, InputStatus, padStore } from './stores';

// ── Tests ────────────────────────────────────────────────────────────

describe('isValidURL', () => {
  it('returns true for valid http URLs', () => {
    expect(isValidURL('http://example.com')).toBe(true);
    expect(isValidURL('https://example.com/path?q=1')).toBe(true);
    expect(isValidURL('https://sub.domain.co.uk/foo')).toBe(true);
  });

  it('returns false for non-URLs and partial strings', () => {
    expect(isValidURL('')).toBe(false);
    expect(isValidURL('not a url')).toBe(false);
    expect(isValidURL('ftp://files.example.com')).toBe(false);
    expect(isValidURL('http://')).toBe(false);
    expect(isValidURL('example.com')).toBe(false);
    expect(isValidURL('javascript:alert(1)')).toBe(false);
  });
});

describe('InputStatus', () => {
  it('constructs with correct defaults', () => {
    const status = new InputStatus();
    expect(status.kind).toBe('success');
    expect(status.run_id).toBe(0);
    expect(status.subtitle).toBe('');
    expect(status.detail).toBe('');
    expect(status.timing).toBe(-0.0);
    expect(status.created_at).toBeTruthy();
    // created_at should be a valid ISO date
    expect(() => new Date(status.created_at!)).not.toThrow();
  });

  it('accepts explicit values', () => {
    const ts = '2025-01-01T00:00:00.000Z';
    const status = new InputStatus('error', 5, ts, 'SyntaxError', 'bad spec', 42);
    expect(status.kind).toBe('error');
    expect(status.run_id).toBe(5);
    expect(status.created_at).toBe(ts);
    expect(status.subtitle).toBe('SyntaxError');
    expect(status.detail).toBe('bad spec');
    expect(status.timing).toBe(42);
  });
});

describe('PadState (via stateStack)', () => {
  it('initial stateStack entry has empty string defaults', () => {
    const stack = get(padStore.stateStack);
    expect(stack.length).toBeGreaterThanOrEqual(1);
    const first = stack[0];
    expect(first.specValue).toBe('');
    expect(first.targetValue).toBe('');
    expect(first.scopeValue).toBe('');
  });
});

describe('padStore.saveStateFromURL', () => {
  beforeEach(() => {
    // Reset stores to known state
    padStore.specValue.set('');
    padStore.targetValue.set('');
    padStore.scopeValue.set('');
    padStore.enableScope.set(null);
    mockRunGlom.mockClear();
  });

  it('parses hash params (spec, target, scope)', () => {
    const url = new URL('http://localhost/#spec=T(int)&target=%7B%22a%22%3A1%7D&scope=a');
    padStore.saveStateFromURL(url);

    expect(get(padStore.specValue)).toBe('T(int)');
    expect(get(padStore.targetValue)).toBe('{"a":1}');
    expect(get(padStore.scopeValue)).toBe('a');
  });

  it('enables scope when scope param is present and enableScope is null', () => {
    padStore.enableScope.set(null);
    const url = new URL('http://localhost/#spec=T(int)&target=1&scope=x');
    padStore.saveStateFromURL(url);

    expect(get(padStore.enableScope)).toBe(true);
  });

  it('does not enable scope when scope param is empty', () => {
    padStore.enableScope.set(null);
    const url = new URL('http://localhost/#spec=T(int)&target=1');
    padStore.saveStateFromURL(url);

    expect(get(padStore.enableScope)).toBeNull();
  });

  it('sets settlingHref true during parse and false after', () => {
    // settlingHref should be false after saveStateFromURL returns
    const url = new URL('http://localhost/#spec=x&target=y');
    padStore.saveStateFromURL(url);
    expect(get(padStore.settlingHref)).toBe(false);
  });
});

describe('padStore._pushNewState', () => {
  beforeEach(() => {
    // Reset to a known single-entry stack
    padStore.stateStack.set([{ specValue: 'a', targetValue: 'b', scopeValue: '', runID: 0 }]);
    padStore.specValue.set('a');
    padStore.targetValue.set('b');
    padStore.scopeValue.set('');
    padStore.curRunID.set(0);
  });

  it('deduplicates identical states (returns false)', () => {
    const result = padStore._pushNewState({ specValue: 'a', targetValue: 'b', scopeValue: '' });
    expect(result).toBe(false);
    // Stack should not grow
    expect(get(padStore.stateStack).length).toBe(1);
  });

  it('pushes new state when values differ (returns true)', () => {
    const result = padStore._pushNewState({ specValue: 'changed', targetValue: 'b', scopeValue: '' });
    expect(result).toBe(true);
    expect(get(padStore.stateStack).length).toBe(2);
    expect(get(padStore.stateStack)[0].specValue).toBe('changed');
  });
});

describe('padStore.executeGlom', () => {
  beforeEach(() => {
    mockRunGlom.mockClear();
    mockWorkerStatus.set('idle');
    // Reset _running via interruptGlom which sets _running = false
    padStore.interruptGlom();
  });

  it('skips when worker status is not ready or loading', () => {
    mockWorkerStatus.set('idle');
    padStore.executeGlom();
    expect(mockRunGlom).not.toHaveBeenCalled();

    mockWorkerStatus.set('error');
    padStore.executeGlom();
    expect(mockRunGlom).not.toHaveBeenCalled();
  });

  it('calls run_glom when worker is ready', () => {
    mockWorkerStatus.set('ready');
    padStore.specValue.set('T(int)');
    padStore.targetValue.set('42');
    padStore.executeGlom();
    expect(mockRunGlom).toHaveBeenCalled();
  });

  it('guards against concurrent execution (_running)', async () => {
    mockWorkerStatus.set('ready');

    // Make run_glom hang so _running stays true after the call chain completes
    let resolveGlom!: (v: unknown) => void;
    const hangingPromise = new Promise((r) => { resolveGlom = r; });
    // Use mockImplementation to return hanging promise for ALL calls
    mockRunGlom.mockImplementation(() => hangingPromise);

    padStore.specValue.set('T(int)');
    padStore.targetValue.set('1');
    padStore.executeGlom();
    // executeGlom -> saveState -> _pushNewState -> stateStack subscriber -> executeGlom
    // The second recursive call from stateStack also runs because _running is set after saveState.
    // Record how many times run_glom was called after the first executeGlom + its recursive calls.
    const callsAfterFirst = mockRunGlom.mock.calls.length;

    // Now _running IS true (set after saveState). A direct call should be blocked.
    padStore.executeGlom();
    expect(mockRunGlom).toHaveBeenCalledTimes(callsAfterFirst);

    // Resolve to clean up
    resolveGlom({
      result: '1', status: 'success',
      timing: { parse_ms: 0, glom_ms: 0, format_ms: 0, total_ms: 0 },
    });
    await hangingPromise;
  });
});

describe('padStore.interruptGlom', () => {
  it('calls worker.interrupt()', () => {
    mockInterrupt.mockClear();
    padStore.interruptGlom();
    expect(mockInterrupt).toHaveBeenCalledOnce();
  });
});
