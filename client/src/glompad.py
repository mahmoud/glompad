
import ast
import json

import glom
import js
from pyodide.ffi import create_proxy

# global object access. TODO: test wiring to a svelte store
# print(list(js.window.SvelteApp.object_entries()))

run_button = Element('run-button')
spec_box = Element('glom-spec-input')
target_box = Element('glom-target-input')
result_box = Element('glom-result-input')

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
    spec_val = get_store_value(js.window.SvelteApp.padStore.specValue).strip()

    js.createObject(create_proxy(globals()), "pyg")

    target_input = get_store_value(js.window.SvelteApp.padStore.targetValue).strip()

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
            result = repr(glom.glom(target, spec))
        except glom.GlomError as ge:
            err = str(ge)
            result = err

    result_box.element.value = load_error or result


def build_spec(spec_str):
    try:
        res = eval(spec_str, dict(glom.__dict__))
    except NameError:
        res = spec_str  # probably? may need a better heuristic
    except SyntaxError:
        raise
    return res


def run_click(e=None):
    run()


run()
js.createObject(create_proxy(globals()), "pyg")

