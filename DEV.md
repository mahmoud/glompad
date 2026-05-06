# Glompad Development

## Stack

- Frontend: Svelte 4, Vite 5, TypeScript 5
- Python-in-browser: Pyodide 0.27.7 (web worker), glom, black
- Worker RPC: Comlink 4.4.2
- Editor: CodeMirror 6
- Build CLI: `glomp.py` (Python, [face](https://github.com/mahmoud/face))
- Error tracking: Sentry
- Deployment: static files on yak.party (nginx)

## Project Structure

```
glompad/
  client/                  # Svelte frontend (Vite project)
    src/
      App.svelte           # Root component
      main.ts              # Entry point, Sentry init, worker warmup
      lib/
        stores.ts          # PadStore: all app state, glom execution dispatch
        worker/            # Pyodide web worker infrastructure
          types.ts         # GlomInput, GlomResult, WorkerStatus (shared types)
          glom-worker.ts   # Worker entry: loads Pyodide, exposes Comlink RPC
          worker-client.ts # Main thread: lifecycle, interrupt, fatal recovery
        Pad.svelte         # Main pad UI (spec, target, scope, result panels)
        Drawer.svelte      # Side drawer (examples, options)
        ...                # Panel, PadInput, StatusBadge, Icon, etc.
      py/
        glom_runner.py     # Pure Python: run_glom(), build_spec(), load_target()
        examples.py        # Example definitions (used by glomp build_examples)
    index.html
    vite.config.ts
    package.json
  glomp.py                 # Build/deploy/serve CLI
  requirements-glomp.txt   # Python deps for glomp.py
```

## Architecture

### How it works

```
Main thread (Svelte) <--Comlink RPC--> Web Worker (Pyodide)
```

1. `main.ts` calls `padStore.warmup()` on page load
2. Worker loads Pyodide from jsdelivr CDN, installs glom+black via micropip
3. `glom_runner.py` is written to Pyodide's virtual filesystem
4. User edits spec/target, clicks Run (or Ctrl-Enter)
5. `stores.ts` calls `worker-client.run_glom({ spec, target, ... })`
6. Worker calls `glom_runner.run_glom()` in Python, returns `GlomResult`
7. `stores.ts` writes result/status back to Svelte stores, UI updates

### Interrupt / Cancellation

- **With cross-origin isolation:** `SharedArrayBuffer` + `pyodide.setInterruptBuffer()` raises `KeyboardInterrupt` in Python (graceful, fast)
- **Without:** `worker.terminate()` + restart (slow, loses state)
- **Runtime check:** `crossOriginIsolated` global determines which path

### Worker types (`types.ts`)

```typescript
interface GlomInput {
  spec: string;
  target: string;
  scope?: string;
  autoformat?: boolean;
}

interface GlomResult {
  result: string;
  status: 'success' | 'error';
  error?: { type: string; message: string; traceback?: string };
  timing: { parse_ms: number; glom_ms: number; format_ms: number; total_ms: number };
  target_format?: 'json' | 'python';
}

type WorkerStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error' | 'restarting';
```

## Development

### Setup

```bash
cd client
npm install
```

### Dev server

```bash
npm run dev
# Vite serves on localhost:5173 with COOP/COEP headers (vite.config.ts plugin)
```

### Type checking

```bash
npm run check
```

### Build

```bash
npm run build
# Output: client/dist/
```

## glomp.py

Build/deploy CLI. Requires Python deps from `requirements-glomp.txt`.

```bash
pip install -r requirements-glomp.txt
```

### Commands

```bash
python glomp.py build --latest                  # build latest glom version only
python glomp.py build --deploy user@host:/path   # build all + rsync
python glomp.py build --basepath /glompad/       # set URL base path
python glomp.py serve                            # build + serve on :8000 with COOP/COEP
python glomp.py serve --port 9000                # custom port
python glomp.py serve --directory ./build/dist/  # serve a specific directory
python glomp.py build_examples                   # regenerate examples.generated.json
python glomp.py make_url SPEC TARGET             # generate a glompad URL fragment
```

### What `build` does

1. Queries PyPI for all glom versions (filters out historical versions without wheels)
2. Runs `npm run build` for each version (or just `--latest`)
3. Injects build metadata (version, timestamp, pyodide version) into `index.html`
4. Optionally rsyncs to deploy target

### What `serve` does

Serves `build/dist/` with Cross-Origin-Isolation headers so `SharedArrayBuffer` works for Pyodide interrupt support. Builds first if no build exists.

## Cross-Origin Isolation

`SharedArrayBuffer` requires two HTTP headers on every response:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

- **Dev:** Vite plugin in `vite.config.ts` adds them automatically
- **`glomp serve`:** Python HTTP handler adds them
- **Production (nginx):** must be configured in the server block:

```nginx
location /glompad/ {
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "credentialless" always;
}
```

Use `credentialless` (not `require-corp`) for COEP to avoid breaking CDN resources (jsdelivr, Google Fonts).

## URL State

Spec, target, and scope are stored in the URL hash fragment:

```
#spec=T%5B0%5D&target=%5B1%2C+2%2C+3%5D&v=1
```

`v=1` is the format version. Examples link directly to pre-populated URLs.
