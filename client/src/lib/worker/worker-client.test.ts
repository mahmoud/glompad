import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// --- Mocks ---

const mockTerminate = vi.fn();
const mockPostMessage = vi.fn();

class MockWorker {
  terminate = mockTerminate;
  postMessage = mockPostMessage;
  constructor(_url: URL | string, _opts?: { type: string }) {}
}

vi.stubGlobal('Worker', MockWorker);

const mockInitialize = vi.fn();
const mockRunGlom = vi.fn();
const mockAutoformat = vi.fn();

vi.mock('comlink', () => ({
  wrap: () => ({
    initialize: mockInitialize,
    run_glom: mockRunGlom,
    autoformat: mockAutoformat,
  }),
}));

import type { WorkerClient } from './worker-client';
import type { WorkerStatus } from './types';

describe('worker-client', () => {
  let client: WorkerClient;
  let mod: typeof import('./worker-client');

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInitialize.mockResolvedValue({
      pyodide_version: '0.27.7',
      glom_version: '24.11.0',
    });
    mockRunGlom.mockResolvedValue({
      result: '42',
      status: 'success',
      timing: { parse_ms: 1, glom_ms: 2, format_ms: 0, total_ms: 3 },
    });
    mockAutoformat.mockResolvedValue('formatted code');

    mod = await import('./worker-client');
    client = mod.get_worker_client();
  });

  afterEach(() => {
    client.destroy();
  });

  describe('singleton', () => {
    it('get_worker_client() returns the same instance', () => {
      const a = mod.get_worker_client();
      const b = mod.get_worker_client();
      expect(a).toBe(b);
    });
  });

  describe('start()', () => {
    it('transitions status: idle → loading → ready', async () => {
      const observed: WorkerStatus[] = [];
      const unsub = client.status.subscribe((s) => observed.push(s));

      await client.start();
      unsub();

      expect(observed).toContain('idle');
      expect(observed).toContain('loading');
      expect(observed).toContain('ready');
      expect(observed.indexOf('loading')).toBeLessThan(observed.indexOf('ready'));
    });

    it('is idempotent — second call does not reinitialize', async () => {
      await client.start();
      await client.start();
      // initialize() should have been called exactly once
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('run_glom()', () => {
    const input = { spec: '"a"', target: '{"a": 1}' };

    it('calls ensure_ready then returns result from proxy', async () => {
      await client.start();
      const result = await client.run_glom(input);
      expect(result.status).toBe('success');
      expect(result.result).toBe('42');
      expect(mockRunGlom).toHaveBeenCalledWith(input);
    });

    it('sets status to running then back to ready', async () => {
      await client.start();

      let sawRunning = false;
      const unsub = client.status.subscribe((s) => {
        if (s === 'running') sawRunning = true;
      });

      await client.run_glom(input);
      unsub();

      expect(sawRunning).toBe(true);
      expect(get(client.status)).toBe('ready');
    });

    it('timeout fires after DEFAULT_TIMEOUT_MS (10s)', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });

      await client.start();

      // Make run_glom hang forever
      mockRunGlom.mockReturnValue(new Promise(() => {}));

      const promise = client.run_glom(input);
      // Suppress unhandled rejection
      promise.catch(() => {});

      // Flush microtasks so the async body reaches the setTimeout registration
      await vi.advanceTimersByTimeAsync(0);
      expect(get(client.status)).toBe('running');

      // Advance past the 10s timeout — hard_restart rejects pending
      await vi.advanceTimersByTimeAsync(10_000);

      await expect(promise).rejects.toThrow('Worker restarted due to timeout');

      vi.useRealTimers();
    });
  });

  describe('timeout escalation (cross-origin isolated)', () => {
    let isolatedClient: WorkerClient;
    let sabBuffer: SharedArrayBuffer | null = null;

    beforeEach(async () => {
      // Destroy the default non-isolated client
      client.destroy();

      vi.stubGlobal('crossOriginIsolated', true);

      mockPostMessage.mockImplementation((msg: { type: string; buffer: SharedArrayBuffer }) => {
        if (msg && msg.type === 'set-interrupt-buffer') {
          sabBuffer = msg.buffer;
        }
      });

      // Fresh module import to pick up crossOriginIsolated=true at module-init
      vi.resetModules();
      vi.doMock('comlink', () => ({
        wrap: () => ({
          initialize: mockInitialize,
          run_glom: mockRunGlom,
          autoformat: mockAutoformat,
        }),
      }));
      vi.stubGlobal('Worker', MockWorker);
      vi.stubGlobal('crossOriginIsolated', true);

      const freshMod = await import('./worker-client');
      isolatedClient = freshMod.get_worker_client();
      await isolatedClient.start();
    });

    afterEach(() => {
      isolatedClient.destroy();
      sabBuffer = null;
      vi.stubGlobal('crossOriginIsolated', undefined);
    });

    it('tier 1: writes 2 to interrupt_buffer when cross-origin isolated', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });

      expect(sabBuffer).not.toBeNull();
      const view = new Int32Array(sabBuffer!);
      expect(view[0]).toBe(0);

      mockRunGlom.mockReturnValue(new Promise(() => {}));
      const promise = isolatedClient.run_glom({ spec: '"a"', target: '{}' });
      promise.catch(() => {});

      // Flush microtasks, then fire the 10s timeout
      await vi.advanceTimersByTimeAsync(10_000);

      // Tier 1: interrupt_buffer[0] should be 2
      expect(view[0]).toBe(2);

      // Advance tier 2 grace to resolve the pending promise
      await vi.advanceTimersByTimeAsync(1_000);
      await expect(promise).rejects.toThrow('Worker restarted due to timeout');

      vi.useRealTimers();
    });

    it('tier 2: hard_restart fires after TIER1_GRACE_MS if still pending', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });

      mockRunGlom.mockReturnValue(new Promise(() => {}));
      const promise = isolatedClient.run_glom({ spec: '"a"', target: '{}' });
      promise.catch(() => {});

      // Fire tier 1 timeout
      await vi.advanceTimersByTimeAsync(10_000);

      // Fire tier 2 grace period
      await vi.advanceTimersByTimeAsync(1_000);

      // Worker should have been terminated (hard_restart)
      expect(mockTerminate).toHaveBeenCalled();
      await expect(promise).rejects.toThrow('Worker restarted due to timeout');

      vi.useRealTimers();
    });
  });

  describe('hard_restart()', () => {
    it('rejects all pending promises with timeout error', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      await client.start();

      mockRunGlom.mockReturnValue(new Promise(() => {}));

      const p1 = client.run_glom({ spec: '"a"', target: '{}' });
      p1.catch(() => {});
      const p2 = client.run_glom({ spec: '"b"', target: '{}' });
      p2.catch(() => {});

      // Let both async bodies register their timeouts
      await vi.advanceTimersByTimeAsync(0);

      // Trigger timeout on the first one (fires hard_restart which rejects all)
      await vi.advanceTimersByTimeAsync(10_000);

      await expect(p1).rejects.toThrow('Worker restarted due to timeout');
      await expect(p2).rejects.toThrow('Worker restarted due to timeout');

      vi.useRealTimers();
    });

    it('terminates old worker and creates new one on restart', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      await client.start();

      mockRunGlom.mockReturnValue(new Promise(() => {}));
      const promise = client.run_glom({ spec: '"a"', target: '{}' });
      promise.catch(() => {});

      // Flush microtasks + fire timeout
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockTerminate).toHaveBeenCalled();

      // hard_restart calls start() internally — flush to let it resolve
      await vi.advanceTimersByTimeAsync(0);

      // initialize() called twice: once for initial start, once for restart
      expect(mockInitialize).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('interrupt()', () => {
    it('with SAB writes 2 to buffer', async () => {
      client.destroy();

      let sabBuffer: SharedArrayBuffer | null = null;
      mockPostMessage.mockImplementation((msg: { type: string; buffer: SharedArrayBuffer }) => {
        if (msg && msg.type === 'set-interrupt-buffer') {
          sabBuffer = msg.buffer;
        }
      });

      vi.stubGlobal('crossOriginIsolated', true);
      vi.resetModules();
      vi.doMock('comlink', () => ({
        wrap: () => ({
          initialize: mockInitialize,
          run_glom: mockRunGlom,
          autoformat: mockAutoformat,
        }),
      }));
      vi.stubGlobal('Worker', MockWorker);

      const freshMod = await import('./worker-client');
      const isolatedClient = freshMod.get_worker_client();
      await isolatedClient.start();

      expect(sabBuffer).not.toBeNull();
      const view = new Int32Array(sabBuffer!);

      isolatedClient.interrupt();
      expect(view[0]).toBe(2);

      isolatedClient.destroy();
      vi.stubGlobal('crossOriginIsolated', undefined);
    });

    it('without SAB calls hard_restart (terminates worker)', async () => {
      await client.start();
      client.interrupt();
      expect(mockTerminate).toHaveBeenCalled();
    });
  });

  describe('destroy()', () => {
    it('clears everything, rejects pending, sets status idle', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      await client.start();

      mockRunGlom.mockReturnValue(new Promise(() => {}));
      const promise = client.run_glom({ spec: '"a"', target: '{}' });
      promise.catch(() => {});

      // Flush microtasks so run_glom body registers the pending entry
      await vi.advanceTimersByTimeAsync(0);

      client.destroy();

      expect(get(client.status)).toBe('idle');
      expect(get(client.ready_info)).toBeNull();
      expect(mockTerminate).toHaveBeenCalled();
      await expect(promise).rejects.toThrow('Worker destroyed');

      vi.useRealTimers();
    });
  });

  describe('fatal Pyodide error', () => {
    it('triggers restart', async () => {
      await client.start();

      const fatalError = Object.assign(new Error('Fatal'), { pyodide_fatal_error: true });
      mockRunGlom.mockRejectedValue(fatalError);

      await expect(client.run_glom({ spec: '"a"', target: '{}' })).rejects.toThrow('Fatal');

      // hard_restart was called — worker terminated
      expect(mockTerminate).toHaveBeenCalled();
      // initialize called twice: initial + restart
      expect(mockInitialize).toHaveBeenCalledTimes(2);
    });
  });
});
