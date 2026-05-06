// Shared types for main thread ↔ worker communication.
// All values crossing the worker boundary must be serializable (no functions, proxies, or classes).

export interface GlomInput {
  spec: string;
  target: string;
  scope?: string;
  autoformat?: boolean;
}

export interface GlomResult {
  result: string;
  status: 'success' | 'error';
  error?: {
    type: string;
    message: string;
    traceback?: string;
  };
  timing: {
    parse_ms: number;
    glom_ms: number;
    format_ms: number;
    total_ms: number;
  };
  // When the target was JSON, results are formatted as JSON; otherwise Python repr
  target_format?: 'json' | 'python';
}

export type WorkerStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error' | 'restarting';

export interface WorkerReadyInfo {
  pyodide_version: string;
  glom_version: string;
}

// The RPC surface the worker exposes via Comlink
export interface GlomWorkerAPI {
  initialize(): Promise<WorkerReadyInfo>;
  run_glom(input: GlomInput): Promise<GlomResult>;
  autoformat(code: string): Promise<string>;
}
