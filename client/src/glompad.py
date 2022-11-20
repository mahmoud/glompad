
import ast
import json
import pprint

import js
from pyodide.ffi import create_proxy

import glom

def get_store_value(store):
    "Get the current value of a Svelte store."
    ret = None
    def set_ret(val):
        nonlocal ret
        ret = val
    unsub = store.subscribe(set_ret)
    unsub()
    return ret


def run():
    js.createObject(create_proxy(globals()), "pyg")

    stateStack = get_store_value(js.window.SvelteApp.padStore.stateStack)
    spec_val = glom.glom(stateStack, glom.T[0].specValue, default='').strip()
    target_input = glom.glom(stateStack, glom.T[0].targetValue, default='').strip()

    load_error = None
    try:
        spec = build_spec(spec_val)
    except Exception as e:
        load_error = str(e)
        js.window.SvelteApp.padStore.specStatus.set('Error')
    else:
        js.window.SvelteApp.padStore.specStatus.set('OK')

    if not load_error:
        try:
            target = json.loads(target_input)
        except json.JSONDecodeError:
            try:
                target = ast.literal_eval(target_input)
            except SyntaxError:
                load_error = "Target must JSON or Python literal."
                js.window.SvelteApp.padStore.targetStatus.set('Error')
            else:
                js.window.SvelteApp.padStore.targetStatus.set('OK: Python')
        else:
            js.window.SvelteApp.padStore.targetStatus.set('OK: JSON')

    if not load_error:
        try:
            result = glom.glom(target, spec)
            result = pprint.pformat(result)
        except glom.GlomError as ge:
            err = str(ge)
            result = err
            js.window.SvelteApp.padStore.resultStatus.set(type(ge).__name__)
            js.window.SvelteApp.padStore.resultValue.set(err)
        else:
            js.window.SvelteApp.padStore.resultStatus.set('OK')
            js.window.SvelteApp.padStore.resultValue.set(result)

    return


def build_spec(spec_str):
    try:
        res = eval(spec_str, dict(glom.__dict__))
    except NameError:
        res = spec_str.partition('#')[0]  # probably? may need a better heuristic
    except SyntaxError:
        raise
    return res


def run_click(e=None):
    run()


run()
js.createObject(create_proxy(globals()), "pyg")

