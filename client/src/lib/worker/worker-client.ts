/**
 * Main-thread client for the glom web worker.
 *
 * Manages worker lifecycle, provides Comlink RPC proxy, handles
 * interrupt (SharedArrayBuffer when cross-origin isolated, worker.terminate() fallback),
 * and auto-recovers from fatal Pyodide errors.
 */

import * as Comlink from 'comlink';
import { writable, get, type Writable } from 'svelte/store';
import type { GlomInput, GlomResult, GlomWorkerAPI, WorkerReadyInfo, WorkerStatus } from './types';

export { type GlomInput, type GlomResult, type WorkerStatus } from './types';

export interface WorkerClient {
  /** Current worker lifecycle state */
  status: Writable<WorkerStatus>;
  /** Info populated after successful init (pyodide version, glom version) */
  ready_info: Writable<WorkerReadyInfo | null>;
  /** Start the worker and load Pyodide. Safe to call multiple times. */
  start(): Promise<void>;
  /** Run a glom spec against target data */
  run_glom(input: GlomInput): Promise<GlomResult>;
  /** Format code with black */
  autoformat(code: string): Promise<string>;
  /** Interrupt a running computation. Graceful (SAB) when available, hard kill otherwise. */
  interrupt(): void;
  /** Destroy the worker. */
  destroy(): void;
}

// Singleton so we don't spin up multiple workers
let _instance: WorkerClient | null = null;

export function get_worker_client(): WorkerClient {
  if (!_instance) {
    _instance = create_worker_client();
  }
  return _instance;
}

function create_worker_client(): WorkerClient {
  const status: Writable<WorkerStatus> = writable('idle');
  const ready_info: Writable<WorkerReadyInfo | null> = writable(null);

  let worker: Worker | null = null;
  let proxy: Comlink.Remote<GlomWorkerAPI> | null = null;
  let interrupt_buffer: Int32Array | null = null;
  let init_promise: Promise<void> | null = null;

  const cross_origin_isolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;

  // Timeout: two-tier escalation (SIGINT via SAB → hard kill)
  const DEFAULT_TIMEOUT_MS = 10_000;
  const TIER1_GRACE_MS = 1_000;

  // Track active RPC calls so we can reject them on worker respawn
  type PendingEntry = { reject: (err: Error) => void };
  const pending = new Set<PendingEntry>();

  function create_worker(): void {
    // Vite handles the ?worker import URL; we use the standard Worker constructor
    // with type: 'module' for ES module workers.
    worker = new Worker(
      new URL('./glom-worker.ts', import.meta.url),
      { type: 'module' },
    );

    proxy = Comlink.wrap<GlomWorkerAPI>(worker);

    // Set up SharedArrayBuffer interrupt if cross-origin isolated
    if (cross_origin_isolated) {
      const sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
      interrupt_buffer = new Int32Array(sab);
      worker.postMessage({ type: 'set-interrupt-buffer', buffer: sab });
    }
  }

  async function start(): Promise<void> {
    // Prevent double initialization
    if (init_promise) {
      return init_promise;
    }

    init_promise = (async () => {
      try {
        status.set('loading');
        create_worker();

        const info = await proxy!.initialize();
        ready_info.set(info);
        status.set('ready');
      } catch (err) {
        console.error('[worker-client] Initialization failed:', err);
        status.set('error');
        init_promise = null;
        throw err;
      }
    })();

    return init_promise;
  }

  async function ensure_ready(): Promise<void> {
    const cur = get(status);
    if (cur === 'ready') return;
    if (cur === 'loading') return init_promise!;
    if (cur === 'idle' || cur === 'error') return start();
    // 'running' or 'restarting' — wait for current init
    if (init_promise) return init_promise;
    return start();
  }

  async function run_glom(input: GlomInput): Promise<GlomResult> {
    await ensure_ready();
    status.set('running');

    let entry: PendingEntry | null = null;
    let timeout_id: ReturnType<typeof setTimeout> | null = null;

    try {
      const result = await new Promise<GlomResult>((resolve, reject) => {
        entry = { reject };
        pending.add(entry);

        // Start the RPC call
        proxy!.run_glom(input).then(resolve, reject);

        // Start the timeout
        timeout_id = setTimeout(() => handle_timeout(entry!), DEFAULT_TIMEOUT_MS);
      });

      status.set('ready');
      return result;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'pyodide_fatal_error' in err) {
        console.error('[worker-client] Fatal Pyodide error, restarting worker');
        await restart();
        throw err;
      }
      status.set('ready');
      throw err;
    } finally {
      if (entry) pending.delete(entry);
      if (timeout_id) clearTimeout(timeout_id);
    }
  }

  async function autoformat(code: string): Promise<string> {
    await ensure_ready();
    return proxy!.autoformat(code);
  }

  function handle_timeout(entry: PendingEntry): void {
    if (cross_origin_isolated && interrupt_buffer) {
      // Tier 1: graceful SIGINT via SharedArrayBuffer
      interrupt_buffer[0] = 2;

      setTimeout(() => {
        // Reset buffer for next use
        if (interrupt_buffer) interrupt_buffer[0] = 0;
        // If still pending after grace period, escalate to hard kill
        if (pending.has(entry)) {
          hard_restart();
        }
      }, TIER1_GRACE_MS);
    } else {
      // No SharedArrayBuffer — go straight to hard kill
      hard_restart();
    }
  }

  function interrupt(): void {
    if (cross_origin_isolated && interrupt_buffer) {
      // Graceful: sets the Pyodide interrupt flag, triggers KeyboardInterrupt in Python
      interrupt_buffer[0] = 2;
    } else {
      // Hard kill: terminate the worker and restart
      hard_restart();
    }
  }

  function hard_restart(): void {
    // Reject all pending RPC calls before terminating the worker
    const err = new Error('Worker restarted due to timeout');
    for (const entry of pending) {
      entry.reject(err);
    }
    pending.clear();

    if (worker) {
      worker.terminate();
      worker = null;
    }
    proxy = null;
    interrupt_buffer = null;
    init_promise = null;
    status.set('restarting');
    // Re-initialize in the background
    start().catch((err) => {
      console.error('[worker-client] Restart failed:', err);
    });
  }

  async function restart(): Promise<void> {
    hard_restart();
    await init_promise;
  }

  function destroy(): void {
    // Reject any in-flight calls
    const err = new Error('Worker destroyed');
    for (const entry of pending) {
      entry.reject(err);
    }
    pending.clear();

    if (worker) {
      worker.terminate();
      worker = null;
    }
    proxy = null;
    interrupt_buffer = null;
    init_promise = null;
    status.set('idle');
    ready_info.set(null);
    _instance = null;
  }

  return {
    status,
    ready_info,
    start,
    run_glom,
    autoformat,
    interrupt,
    destroy,
  };
}
