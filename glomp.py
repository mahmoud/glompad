import copy
import os
import os.path
import json
import subprocess
import shutil
import datetime
from importlib.machinery import SourceFileLoader
import textwrap
import http.server


import face
from boltons.fileutils import mkdir_p, atomic_save
import html5lib
from hyperlink import DecodedURL
import black

CUR_DIR = os.path.dirname(os.path.abspath(__file__)) + '/'

# Pyodide 0.27.7 uses emscripten 3.1.46, wasm32 platform
WHEEL_PLATFORM = 'emscripten_3_1_46_wasm32'
PYODIDE_VERSION = '0.27.7'

# Packages to install via micropip in the worker
PYODIDE_PACKAGES = ['glom', 'black']

# These historical glom versions don't have wheels
IGNORED_VERSIONS = ['23.1.0', '20.5.0', '19.10.0', '19.2.0', '19.1.0', '18.4.0', '18.3.1', '18.3.0', '18.2.0', '18.1.1', '18.1.0', '18.0.0', '0.0.3', '0.0.2']

GLOBAL_ENV_VARS = {}


def _subproc_run(*a, **kw):
    print(f'{a} -- {kw}')
    env = dict(GLOBAL_ENV_VARS)
    env.update(kw.get('env', os.environ))
    kw['env'] = env
    return subprocess.run(*a, **kw)


def html_text_to_tree(html_text):
    return html5lib.parse(html_text, namespaceHTMLElements=False)


def html_tree_to_text(html_tree):
    options = {'quote_attr_values': 'always',
               'use_trailing_solidus': True,
               'space_before_trailing_solidus': True}
    serializer = html5lib.serializer.HTMLSerializer(**options)
    walker = html5lib.getTreeWalker('etree')
    stream = serializer.serialize(walker(html_tree))
    return u''.join(stream)


def _build_client(out_base, base_url_path, version, is_latest, all_versions):
    out_dir = out_base
    if not is_latest:
        base_url_path = base_url_path + f'v{version}/'
        out_dir = out_base + f'v{version}/'
    _subproc_run([
        'npm', 'run', 'build', '--', 
        '--outDir', '../' + out_dir,
        '--base', base_url_path], 
      cwd='./client')

    # Inject build metadata into the built index.html
    index_text = open(out_dir + 'index.html').read()
    html = html_text_to_tree(index_text)

    build_metadata = {
        "version": version,
        "all_versions": all_versions,
        "pyodide_version": PYODIDE_VERSION,
        "build_timestamp": datetime.datetime.utcnow().isoformat()
    }
    head_el = html.find('.//head')
    meta_script_el = html.makeelement('script', {})
    meta_script_el.text = f"window.glompad_meta = {json.dumps(build_metadata, indent=2)};"
    head_el.insert(len(html), meta_script_el)

    new_index_text = '<!DOCTYPE html>\n' + html_tree_to_text(html)
    with atomic_save(out_dir + 'index.html', text_mode=True) as f:
        f.write(new_index_text)

    if is_latest:
        _build_client(
            out_base=out_base, 
            base_url_path=base_url_path, 
            version=version, 
            is_latest=False, 
            all_versions=all_versions)

    return


def build(latest, versions, deploy, basepath='/'):
    # make build directory
    if not CUR_DIR.endswith('/glompad/') and os.path.isdir(CUR_DIR + '.git'):
        raise face.UsageError('glompad build expected to run from project root')

    if not (basepath.startswith('/') and basepath.endswith('/')):
        raise face.UsageError('basepath must start and end with /')

    res = _subproc_run(['pip', 'index', 'versions', 'glom'], capture_output=True)
    output_lines = res.stdout.decode('utf8').splitlines()
    assert 1 < len(output_lines) < 5, 'unexpected number of lines from pip'
    all_versions = [
        v.strip() for v in 
        output_lines[1].partition(':')[2].split(',')
        if v.strip() not in IGNORED_VERSIONS]
    latest_version = all_versions[0]
    if latest:
        if versions:
            raise face.UsageError('--versions and --latest are mutually exclusive options')
        versions = [latest_version]
    elif versions:
        unrecognized_versions = sorted(set(all_versions) - set(versions))
        if unrecognized_versions:
            raise face.UsageError(f'unrecognized versions: {unrecognized_versions}')
    else:
        versions = all_versions

    if os.path.exists('./build'):
        shutil.rmtree('./build')
    mkdir_p('./build/dist/')

    for version in versions:
        _build_client(
            out_base='./build/dist/', 
            base_url_path=basepath,
            version=version, 
            is_latest=(version == latest_version),
            all_versions=all_versions,
        )

    if not deploy:
        return

    _subproc_run(['rsync', '-avzP', 'build/dist/', deploy])


def make_url(spec, target):
    # v1 format: #spec=a.b.c&target={}&v=1
    frag_map = {
        'spec': spec,
        'target': target,
        'v': '1',
    }
    url = DecodedURL().replace(query=frag_map.items())
    output = url.to_text().replace('?', '#', 1)

    return output


def build_examples():
    examples_mod = SourceFileLoader('examples', './client/src/py/examples.py').load_module()
    example_cls = examples_mod.Example

    example_list = []
    for name, obj in examples_mod.__dict__.items():
        if not isinstance(obj, type) or not issubclass(obj, example_cls):
            continue
        if obj is example_cls:
            continue
        print(f'{name} - {obj.label}')

        if obj.formatted_spec:
            formatted_spec = textwrap.dedent(obj.formatted_spec)
            # sanity check
            eval(formatted_spec, copy.copy(examples_mod.__dict__))
        else:
            try:
                # sanity check
                if not obj.target_url:
                    examples_mod.glom(copy.deepcopy(obj.target), copy.deepcopy(obj.spec))
            except Exception as e:
                raise face.UsageError(f'problem with example {obj.__name__}:\n{str(e)}')

            formatted_spec = black.format_str(repr(obj.spec), mode=black.Mode())

            desc = formatted_desc = ''
            if obj.__doc__:
                desc = textwrap.dedent(obj.__doc__)
                formatted_desc = '\n'.join(['# ' + line for line in textwrap.wrap(desc, width=100, break_long_words=False, break_on_hyphens=False)])
                formatted_spec = formatted_desc + '\n' + formatted_spec

        if obj.target_url:
            formatted_target = obj.target_url
        else:
            formatted_target = black.format_str(repr(obj.target), mode=black.Mode())

        example_dict = {
            'label': obj.label,
            'icon': obj.icon,
            'desc': desc,
            'section': obj.section,
            'url': make_url(spec=formatted_spec, target=formatted_target),
        }
        example_list.append(example_dict)

    examples_wrapper = {'example_list': example_list} 

    with atomic_save('./client/src/examples.generated.json', text_mode=True) as f:
        json.dump(examples_wrapper, f, indent=2)

    return
    


class COIRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that adds Cross-Origin Isolation headers.

    Required for SharedArrayBuffer, which Pyodide uses for
    KeyboardInterrupt-based cancellation of running Python code.
    """
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'credentialless')
        super().end_headers()


def serve(port=8000, directory=''):
    """Serve the build output with cross-origin isolation headers.

    Builds the latest version first if build/dist/ doesn't exist,
    then starts a local HTTP server with COOP/COEP headers so that
    SharedArrayBuffer is available for Pyodide interrupt support.
    """
    serve_dir = directory or os.path.join(CUR_DIR, 'build', 'dist')
    if not os.path.isdir(serve_dir):
        if directory:
            raise face.UsageError(f'directory does not exist: {serve_dir}')
        print(f'No build found at {serve_dir}, building latest...')
        build(latest=True, versions=None, deploy=None)

    os.chdir(serve_dir)
    handler = COIRequestHandler
    with http.server.HTTPServer(('', port), handler) as httpd:
        url = f'http://localhost:{port}/'
        print(f'Serving {serve_dir} at {url}')
        print(f'  Cross-Origin-Opener-Policy: same-origin')
        print(f'  Cross-Origin-Embedder-Policy: credentialless')
        print(f'  crossOriginIsolated: true (SharedArrayBuffer available)')
        print(f'Press Ctrl+C to stop.')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nStopped.')


cmd = face.Command(name='glomp', func=None)

build_cmd = face.Command(build, doc='build and optionally deploy glompad')
build_cmd.add('--latest', parse_as=True, doc='only build/deploy latest version of glom')
build_cmd.add('--versions', parse_as=face.ListParam(str), missing=None)
build_cmd.add('--deploy', parse_as=str, doc='deploy destination (server:/path/to/public/html)')
build_cmd.add('--basepath', parse_as=str, missing='/', doc='server path prefix')

serve_cmd = face.Command(serve, doc='build and serve with cross-origin isolation headers')
serve_cmd.add('--port', parse_as=int, missing=8000, doc='port to listen on')
serve_cmd.add('--directory', parse_as=str, missing='', doc='directory to serve (default: build/dist/)')

cmd.add(build_cmd)
cmd.add(serve_cmd)
cmd.add(make_url)
cmd.add(build_examples)


if __name__ == '__main__':
    cmd.run()
