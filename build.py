import os
import os.path
import json
import subprocess
import shutil

import face
from boltons.fileutils import mkdir_p, atomic_save

CUR_DIR = os.path.dirname(os.path.abspath(__file__)) + '/'
PYSCRIPT_CONFIG_REL_PATH = './client/src/py/pyscript_config.json'
PYSCRIPT_CONFIG_PATH = CUR_DIR + PYSCRIPT_CONFIG_REL_PATH

WHEEL_PLATFORM = 'emscripten-3.1.14-wasm32'

def _subproc_run(*a, **kw):
    print(f'{a} -- {kw}')
    return subprocess.run(*a, **kw)


def _build_client(out_base, base_url_path, version, is_latest):
    out_dir = out_base
    if not is_latest:
        base_url_path = base_url_path + f'v{version}/'
        out_dir = out_base + f'v{version}/'
    _subproc_run([
        'pnpm', 'exec', 'vite', 'build', 
        '--outDir', '../' + out_dir,
        '--base', base_url_path], 
      cwd='./client')

    # TODO: until transclusion is implemented, copy over individual files
    shutil.copytree('./client/src/py/', out_dir + 'src/py/')

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

    with atomic_save(out_dir + 'src/py/pyscript_config.json', text_mode=True) as f:
        json.dump(pyscript_config, f, indent=2)

    return




def run(latest, versions, deploy, basepath='/'):
    # make build directory
    if not CUR_DIR.endswith('/glompad/') and os.path.isdir(CUR_DIR + '.git'):
        raise face.UsageError('glompad build expected to run from project root')
    if not os.path.isfile(PYSCRIPT_CONFIG_PATH):
        raise face.UsageError(f'could not find config at: {PYSCRIPT_CONFIG_PATH}')


    if not (basepath.startswith('/') and basepath.endswith('/')):
        raise face.UsageError('basepath must start and end with /')

    res = _subproc_run(['pip', 'index', 'versions', 'glom'], capture_output=True)
    output_lines = res.stdout.decode('utf8').splitlines()
    assert len(output_lines) == 2, 'unexpected number of lines from pip'
    all_versions = [
        v.strip() for v in 
        output_lines[1].partition(':')[2].split(',')]
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

    # capture current version, iterate over versions
    # copy over dist directory
    # pip download glom==version to dist/assets/wheels/

    assert 'v18' in os.getenv('NVM_BIN', 'v18.'), 'expected node 18'
    shutil.rmtree('./build')
    mkdir_p('./build/dist/')

    for version in versions:
        _build_client(
            out_base='./build/dist/', 
            base_url_path=basepath,
            version=version, 
            is_latest=(version == latest_version)
        )


    # 
    # add glom version, build time element

    # TODO: future: build manifest

cmd = face.Command(run)
cmd.add('--latest', parse_as=True, doc='only build/deploy latest version of glom')
cmd.add('--versions', parse_as=face.ListParam(str), missing=None)
cmd.add('--deploy', parse_as=True, doc='whether to deploy')
cmd.add('--basepath', parse_as=str, missing='/', doc='server path prefix')

if __name__ == '__main__':
    cmd.run()

'''
rsync -avzP dist/* sedimental.org:/home/mahmoud/sedimental/public/glompad
'''