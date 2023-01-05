import copy
import os
import os.path
import json
import subprocess
import shutil
import datetime
from importlib.machinery import SourceFileLoader
import textwrap


import face
from boltons.fileutils import mkdir_p, atomic_save
import html5lib
from hyperlink import DecodedURL
import black

CUR_DIR = os.path.dirname(os.path.abspath(__file__)) + '/'
PYSCRIPT_CONFIG_REL_PATH = './client/src/py/pyscript_config.json'
PYSCRIPT_CONFIG_PATH = CUR_DIR + PYSCRIPT_CONFIG_REL_PATH

WHEEL_PLATFORM = 'emscripten-3.1.14-wasm32'

# These historical versions don't have wheels: (TODO: could upload wheels for these)
IGNORED_VERSIONS = ['20.5.0', '19.10.0', '19.2.0', '19.1.0', '18.4.0', '18.3.1', '18.3.0', '18.2.0', '18.1.1', '18.1.0', '18.0.0', '0.0.3', '0.0.2']

def _subproc_run(*a, **kw):
    print(f'{a} -- {kw}')
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
        'pnpm', 'exec', 'vite', 'build', 
        '--outDir', '../' + out_dir,
        '--base', base_url_path], 
      cwd='./client')

    pyscript_config = json.load(open(PYSCRIPT_CONFIG_PATH))
    packages = list(pyscript_config['packages'])
    packages.remove('glom')
    packages.append(f'glom=={version}')
    whl_dir = out_dir + 'whl/'
    mkdir_p(whl_dir)
    _subproc_run(['pip', 'download', '--dest', whl_dir, '--platform', WHEEL_PLATFORM, "--only-binary=:all:"] + packages)

    whl_packages = sorted(['whl/' + p for p in os.listdir(whl_dir)], key=lambda f: os.path.getmtime(out_dir + f))
    assert 2 < len(whl_packages) < 50, "unexpected number of packages"
    pyscript_config['packages'] = whl_packages

    index_text = open(out_dir + 'index.html').read()
    html = html_text_to_tree(index_text)
    py_src = open('client/' + html.find('.//py-script').attrib['src']).read()
    html.find('.//py-script').text = py_src
    _script_path = html.find('.//py-script').attrib.pop('src')
    pyscript_config['paths'].remove(_script_path)

    html.find('.//py-config').text = json.dumps(pyscript_config, indent=2)
    html.find('.//py-config').attrib.pop('src')

    build_metadata = {
        "version": version,
        "all_versions": all_versions,
        "build_timestamp": datetime.datetime.utcnow().isoformat()
    }
    head_el = html.find('.//head')
    meta_script_el = html.makeelement('script', {})
    meta_script_el.text = f"window.glompad_meta = {json.dumps(build_metadata, indent=2)};"
    head_el.insert(len(html), meta_script_el)

    new_index_text = html_tree_to_text(html)
    with atomic_save(out_dir + 'index.html', text_mode=True) as f:
        f.write(new_index_text)

    if is_latest:
        # Quick way to get the latest version's own version-qualified build dir
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
    if not os.path.isfile(PYSCRIPT_CONFIG_PATH):
        raise face.UsageError(f'could not find config at: {PYSCRIPT_CONFIG_PATH}')


    if not (basepath.startswith('/') and basepath.endswith('/')):
        raise face.UsageError('basepath must start and end with /')

    res = _subproc_run(['pip', 'index', 'versions', 'glom'], capture_output=True)
    output_lines = res.stdout.decode('utf8').splitlines()
    assert 1 < len(output_lines) < 5, 'unexpected number of lines from pip'
    all_versions = [
        v.strip() for v in 
        output_lines[1].partition(':')[2].split(',')
        if v.strip() not in IGNORED_VERSIONS]
    # NB: we rely on pip to sort the versions in version order (glompad's calver is not 0-padded, so lexical order doesn't help)
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

    assert 'v18' in os.getenv('NVM_BIN', 'v18.'), 'expected node 18'
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
        # TODO: future: build manifest

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

    # wrap in an object to give us some flexibility to do sections or something
    examples_wrapper = {'example_list': example_list} 

    with atomic_save('./client/src/examples.generated.json', text_mode=True) as f:
        json.dump(examples_wrapper, f, indent=2)

    return
    

 
cmd = face.Command(name='glomp', func=None)

build_cmd = face.Command(build, doc='build and optionally deploy glompad')
build_cmd.add('--latest', parse_as=True, doc='only build/deploy latest version of glom')
build_cmd.add('--versions', parse_as=face.ListParam(str), missing=None)
build_cmd.add('--deploy', parse_as=str, doc='deploy destination (server:/path/to/public/html)')
build_cmd.add('--basepath', parse_as=str, missing='/', doc='server path prefix')

cmd.add(build_cmd)
cmd.add(make_url)
cmd.add(build_examples)


if __name__ == '__main__':
    cmd.run()
