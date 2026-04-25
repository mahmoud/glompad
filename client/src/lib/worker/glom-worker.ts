/**
 * Web Worker entry point for Pyodide-powered glom execution.
 *
 * Loads Pyodide + glom/black packages, writes glom_runner.py to the
 * virtual filesystem, and exposes an RPC surface via Comlink.
 *
 * This file runs in a dedicated Worker thread. No DOM access.
 */

import * as Comlink from 'comlink';
import { loadPyodide, type PyodideInterface } from 'pyodide';
import pRetry from 'p-retry';
import type { GlomInput, GlomResult, GlomWorkerAPI, WorkerReadyInfo } from './types';

// Inlined at build time by Vite's ?raw import
import glom_runner_py from '../../py/glom_runner.py?raw';

const PYODIDE_VERSION = '0.27.7';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodide: PyodideInterface | null = null;
let interrupt_buffer: Int32Array | null = null;

/**
 * Load Pyodide from CDN with retry. Separate from package installation
 * so we can report loading progress stages.
 */
async function load_pyodide(): Promise<PyodideInterface> {
  const py = await pRetry(
    () => loadPyodide({ indexURL: PYODIDE_CDN }),
    { retries: 3 },
  );

  if (py.version !== PYODIDE_VERSION) {
    console.warn(
      `[glom-worker] Pyodide version mismatch: expected ${PYODIDE_VERSION}, got ${py.version}`,
    );
  }

  return py;
}

/**
 * Install glom + black via micropip, then write glom_runner.py
 * to the virtual filesystem so it can be imported.
 */
async function install_packages(py: PyodideInterface): Promise<void> {
  await py.loadPackage('micropip');
  const micropip = py.pyimport('micropip');
  await micropip.install(['glom', 'black']);

  // Write our runner module to the virtual FS
  const pathlib = py.pyimport('pathlib');
  const runner_dir = '/tmp/glom_runner/';
  pathlib.Path(runner_dir).mkdir();
  pathlib.Path(runner_dir + 'glom_runner.py').write_text(glom_runner_py);

  const sys = py.pyimport('sys');
  sys.path.append(runner_dir);

  // Set a reasonable recursion limit to avoid fatal JS RangeErrors
  sys.setrecursionlimit(200);
}

/**
 * Configure SharedArrayBuffer-based interrupt if the buffer was passed
 * from the main thread. This allows graceful KeyboardInterrupt on
 * long-running glom specs.
 */
function configure_interrupt(py: PyodideInterface, buffer: Int32Array | null): void {
  if (buffer) {
    interrupt_buffer = buffer;
    py.setInterruptBuffer(buffer);
  }
}

// --- Comlink RPC surface ---

const api: GlomWorkerAPI = {
  async initialize(): Promise<WorkerReadyInfo> {
    const start = performance.now();

    pyodide = await load_pyodide();
    await install_packages(pyodide);

    const glom_mod = pyodide.pyimport('glom');
    const info: WorkerReadyInfo = {
      pyodide_version: pyodide.version,
      glom_version: glom_mod.__version__,
    };

    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    console.log(`[glom-worker] Ready in ${elapsed}s (Pyodide ${info.pyodide_version}, glom ${info.glom_version})`);

    return info;
  },

  async run_glom(input: GlomInput): Promise<GlomResult> {
    if (!pyodide) {
      throw new Error('Worker not initialized');
    }

    // Reset interrupt buffer before each run
    if (interrupt_buffer) {
      interrupt_buffer[0] = 0;
    }

    const runner = pyodide.pyimport('glom_runner');
    const py_result = runner.run_glom(
      input.spec,
      input.target,
      input.scope ?? null,
      input.autoformat ?? false,
    );

    // Convert PyProxy to plain JS object
    const result: GlomResult = py_result.toJs({ dict_converter: Object.fromEntries });
    py_result.destroy();

    return result;
  },

  async autoformat(code: string): Promise<string> {
    if (!pyodide) {
      throw new Error('Worker not initialized');
    }

    const runner = pyodide.pyimport('glom_runner');
    return runner.autoformat(code);
  },
};

// Accept interrupt buffer from main thread before exposing API
// The main thread will postMessage the buffer after creating the worker
self.addEventListener('message', (event) => {
  if (event.data?.type === 'set-interrupt-buffer') {
    if (pyodide) {
      configure_interrupt(pyodide, new Int32Array(event.data.buffer));
    } else {
      // Store for later; will be applied after initialize()
      const pending_buffer = new Int32Array(event.data.buffer);
      const original_init = api.initialize;
      api.initialize = async () => {
        const result = await original_init.call(api);
        configure_interrupt(pyodide!, pending_buffer);
        return result;
      };
    }
  }
});

Comlink.expose(api);
