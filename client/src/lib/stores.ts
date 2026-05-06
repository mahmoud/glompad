import { derived, type Readable, type Writable } from 'svelte/store';
import { writable, get } from 'svelte/store';
import * as Sentry from "@sentry/browser";
import { createMediaStore } from 'svelte-media-queries';

import { createUrlStore } from './urlStore';
import { get_worker_client, type WorkerStatus } from './worker/worker-client';
import type { GlomResult } from './worker/types';

export { darkModeStore } from './darkModeStore';

class PadState {
  constructor(
    public specValue: string = '',
    public targetValue: string = '',
    public scopeValue: string = '',
    public runID: number = 0,
  ) { };
}

type StatusKindValue = 'success' | 'error' | 'pending';

export class InputStatus {
  constructor(
    public kind: StatusKindValue = 'success',
    public run_id: number = 0,
    public created_at: string | null = null,
    public subtitle: string = '',
    public detail: string = '',
    public timing: number = -0.0,
  ) {
    this.created_at = this.created_at ?? new Date().toISOString();
  };
}

export class FetchStatus extends InputStatus {
  constructor(
    public url: string,
    ...params: ConstructorParameters<typeof InputStatus>
  ) {
    super(...params);
  }
}

export const isValidURL = (text: string) => {
  try {
    return !!(text.match(/https?:\/\/.+[./].+/) && new URL(text));
  } catch (e) {
    return false;
  }
};


class PadStore {
  // Worker client reference, initialized lazily
  private _worker = get_worker_client();
  private _running = false;

  constructor(
    public specValue: Writable<string> = writable(''),
    public specStatus: Writable<InputStatus> = writable(new InputStatus()),

    public scopeValue: Writable<string> = writable(''),
    public scopeStatus: Writable<InputStatus> = writable(new InputStatus()),

    public targetValue: Writable<string> = writable(''),
    public targetStatus: Writable<InputStatus> = writable(new InputStatus()),
    public targetURLValue: Writable<string> = writable(''),
    public targetDestStore: Writable<Writable<string>> = writable(null as unknown as Writable<string>),
    public targetFetchStatus: Writable<FetchStatus> = writable(new FetchStatus('')),

    public resultValue: Writable<string> = writable(''),
    public resultStatus: Writable<InputStatus> = writable(new InputStatus()),

    public stateStack: Writable<Array<PadState>> = writable([new PadState()]),
    public curRunID: Writable<number> = writable(0),

    public enableScope: Writable<boolean | null> = writable(null),
    public enableAutoformat: Writable<boolean> = writable(false),
    public enableDebug: Writable<boolean> = writable(false),

    // Disambiguates store writes from URL/example navigation vs fetch results
    public settlingHref: Writable<boolean> = writable(false),

    public targetChanged: Readable<boolean> = null as unknown as Readable<boolean>,
    public specChanged: Readable<boolean> = null as unknown as Readable<boolean>,
    public scopeChanged: Readable<boolean> = null as unknown as Readable<boolean>,
  ) {
    this.targetDestStore.set(targetValue);

    this.stateStack.subscribe(() => this.executeGlom());

    this.targetChanged = derived([this.targetValue, this.stateStack],
      ([tv, ss]) => tv.trim() != ss[0].targetValue.trim())

    this.specChanged = derived([this.specValue, this.stateStack],
      ([sv, ss]) => sv != ss[0].specValue)

    this.scopeChanged = derived([this.scopeValue, this.stateStack],
      ([sv, ss]) => sv != ss[0].scopeValue)
  };

  /** Expose worker status store for UI binding */
  get workerStatus(): Writable<WorkerStatus> {
    return this._worker.status;
  }

  /** Start loading the worker in the background */
  warmup(): void {
    this._worker.start().catch((err) => {
      console.error('[padStore] Worker warmup failed:', err);
    });
  }

  deriveAll(): Readable<unknown> {
    let store_list = Object.values(this).filter(
      (v) => v && typeof v === 'object' && 'subscribe' in v
    );
    //@ts-ignore (this is only used for debug)
    return derived(store_list, (...$vals) => [...$vals])
  }

  toJson(maxLength: number = 60) {
    let copy: Record<string, unknown> = {};
    for (const [key, store] of Object.entries(this)) {
      if (!store || typeof store !== 'object' || !('subscribe' in store)) continue;
      let val = get(store as Writable<unknown>);
      if (typeof val == 'string') {
        val = val.length < maxLength ? val : val.substring(0, maxLength) + '...'
      }
      copy[key] = val;
    }
    if (copy.stateStack && Array.isArray(copy.stateStack)) {
      copy.stateStackLength = (copy.stateStack as PadState[]).length;
      delete copy.stateStack;
    }

    return JSON.stringify(copy, undefined, 2).trim();
  }

  saveStateFromURL(url: URL) {
    const hash = url.hash && url.hash.slice(1)
    const params = new URLSearchParams(hash);
    const newState: Partial<PadState> = {
      "specValue": params.get('spec') || '',
      "targetValue": params.get('target') || '',
      "scopeValue": params.get('scope') || '',
    }
    this.settlingHref.set(true);
    let pushedNewState = false;
    try {
      this.specValue.set(newState.specValue!);
      this.scopeValue.set(newState.scopeValue!);
      this.targetValue.set(newState.targetValue!);

      if (!!newState.scopeValue && get(this.enableScope) === null) {
        this.enableScope.set(true);
      }

      pushedNewState = this._pushNewState(newState);
    } finally {
      this.settlingHref.set(false)
    }
    if (pushedNewState) {
      this.executeGlom();
    }
  }

  _pushNewState(newState: Partial<PadState>) {
    const { runID: _newRunID, ...newStateCopy } = { ...newState } as PadState;
    const { runID: _curRunID, ...curState } = { ...get(this.stateStack)[0] };

    const isCurrent = shallowEqual(curState, newStateCopy)

    if (isCurrent) {
      return false;
    }
    newState['runID'] = get(this.curRunID)
    this.stateStack.update((curVal) => [newState as PadState, ...curVal])
    return true;
  }

  saveState() {
    const targetURLParam = get(this.targetURLValue) && !get(this.settlingHref) ? get(this.targetURLValue) : get(this.targetValue);
    const newState: Partial<PadState> = {
      "specValue": get(this.specValue),
      "scopeValue": get(this.scopeValue),
      "targetValue": get(this.targetValue),
    }
    const pushedNewState = this._pushNewState(newState);
    if (!pushedNewState) {
      return;
    }

    const urlParams: Record<string, string> = {
      "spec": newState.specValue!,
      "target": targetURLParam,
    }
    if (newState.scopeValue) {
      urlParams['scope'] = newState.scopeValue;
    }
    urlParams['v'] = '1';

    let new_url = new URL(window.location.toString());
    new_url.hash = new URLSearchParams(Object.entries(urlParams)).toString();

    if (new_url.toString() != window.location.toString()) {
      urlStore.set?.(new_url.toString());
    }
  }

  /** Run glom via the web worker. Async but fire-and-forget from callers. */
  executeGlom = (): void => {
    const worker_status = get(this._worker.status);
    if (worker_status !== 'ready' && worker_status !== 'loading') {
      // Worker not started yet; skip silently (initial page load, before warmup)
      return;
    }

    if (this._running) {
      return; // already running, don't stack calls
    }

    this.saveState();

    const spec_val = get(this.specValue).trim();
    const target_val = get(this.targetValue).trim();
    const scope_val = get(this.scopeValue).trim();
    const run_id = get(this.curRunID) + 1;
    const enable_autoformat = get(this.enableAutoformat);
    const enable_scope = get(this.enableScope);

    if (!spec_val && run_id <= 1) {
      this.specStatus.set(new InputStatus('pending'));
      return;
    }

    this.curRunID.set(run_id);
    this._running = true;

    // Set all statuses to pending
    this.specStatus.set(new InputStatus('pending', run_id));
    this.targetStatus.set(new InputStatus('pending', run_id));
    this.resultStatus.set(new InputStatus('pending', run_id));

    this._worker.run_glom({
      spec: spec_val,
      target: target_val,
      scope: enable_scope ? scope_val : undefined,
      autoformat: enable_autoformat,
    }).then((result: GlomResult) => {
      this._applyResult(result, run_id, enable_autoformat);
    }).catch((err: unknown) => {
      console.warn('[padStore] executeGlom error:', err);
      Sentry.captureException(err);
      this.resultStatus.set(new InputStatus('error', run_id, null, 'Worker Error', String(err)));
      this.resultValue.set(String(err));
    }).finally(() => {
      this._running = false;
    });
  };

  /** Apply a structured GlomResult to the UI stores */
  private _applyResult(result: GlomResult, run_id: number, enable_autoformat: boolean): void {
    const timing_ms = result.timing.total_ms;

    if (result.status === 'success') {
      const target_subtitle = result.target_format === 'json' ? 'JSON' : 'Python';
      this.specStatus.set(new InputStatus('success', run_id, null, '', '', timing_ms));
      this.targetStatus.set(new InputStatus('success', run_id, null, target_subtitle, '', result.timing.parse_ms));
      this.resultStatus.set(new InputStatus('success', run_id, null, '', '', result.timing.glom_ms));
      this.resultValue.set(result.result);

      // Apply autoformatted inputs if available
      const formatted = (result as GlomResult & { formatted?: Record<string, string> }).formatted;
      if (enable_autoformat && formatted) {
        if (formatted.spec) this.specValue.set(formatted.spec);
        if (formatted.target) this.targetValue.set(formatted.target);
        if (formatted.scope) this.scopeValue.set(formatted.scope);
      }
    } else {
      // Error case
      const error = result.error;
      if (error) {
        const error_detail = error.traceback || error.message;

        if (error.type === 'TargetParseError') {
          this.specStatus.set(new InputStatus('success', run_id));
          this.targetStatus.set(new InputStatus('error', run_id, null, '', error_detail, timing_ms));
        } else if (error.type === 'SyntaxError' || error.type === 'NameError') {
          this.specStatus.set(new InputStatus('error', run_id, null, error.type, error_detail, timing_ms));
        } else {
          // GlomError or other runtime error
          this.specStatus.set(new InputStatus('success', run_id));
          this.targetStatus.set(new InputStatus('success', run_id));
          this.resultStatus.set(new InputStatus('error', run_id, null, error.type, error_detail, timing_ms));
        }
      }
      this.resultValue.set(result.result || (error?.message ?? ''));
    }
  }

  /** Interrupt a running glom computation */
  interruptGlom = (): void => {
    this._worker.interrupt();
    this._running = false;
  };
}

export const padStore = new PadStore();

export const urlStore = createUrlStore(window && window.location.href);

export const largeScreenStore = createMediaStore('(min-width: 520px');


urlStore.subscribe((val: string | URL) => {
  const val_str = typeof val === 'string' ? val : val.toString();
  if (window && window.location.href != val_str) {
    window.location.href = val_str;
    return;
  }
  const url = typeof val === 'string' ? new URL(val) : val;
  padStore.saveStateFromURL(url);
});


function shallowEqual(o1: Record<string, unknown>, o2: Record<string, unknown>): boolean {
  const entries1 = Object.entries(o1);
  const entries2 = Object.entries(o2);
  if (entries1.length !== entries2.length) {
    return false;
  }
  for (let i = 0; i < entries1.length; ++i) {
    if (entries1[i][0] !== entries2[i][0]) {
      return false;
    }
    if (entries1[i][1] !== entries2[i][1]) {
      return false;
    }
  }

  return true;
}
