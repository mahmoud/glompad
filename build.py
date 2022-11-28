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

# These historical versions don't have wheels: (TODO: could upload wheels for these)
IGNORED_VERSIONS = ['20.5.0', '19.10.0', '19.2.0', '19.1.0', '18.4.0', '18.3.1', '18.3.0', '18.2.0', '18.1.1', '18.1.0', '18.0.0', '0.0.3', '0.0.2']

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
    # Also TODO: add glom version, build time element

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


# TODO: Deploy

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
        # TODO: future: build manifest

    if not deploy:
        return

    _subproc_run(['rsync', '-avzP', 'build/dist/', deploy])

 

cmd = face.Command(run)
cmd.add('--latest', parse_as=True, doc='only build/deploy latest version of glom')
cmd.add('--versions', parse_as=face.ListParam(str), missing=None)
cmd.add('--deploy', parse_as=str, doc='deploy destination (server:/path/to/public/html)')
cmd.add('--basepath', parse_as=str, missing='/', doc='server path prefix')

if __name__ == '__main__':
    cmd.run()
