
import ast
import json

import js
from pyodide.ffi import create_proxy

import glom

# global object access. TODO: test wiring to a svelte store
# print(list(js.window.SvelteApp.object_entries()))

run_button = Element('run-button')
spec_box = Element('glom-spec-input')
target_box = Element('glom-target-input')
result_box = Element('glom-result-input')

def run():
    store_val = []
    def set_val(val):
        store_val[:] = [val]
    unsub = js.window.SvelteApp.specStore.subscribe(set_val)
    unsub()

    js.createObject(create_proxy(globals()), "pyg")

    spec = store_val[0].strip()
    target_input = target_box.value.strip()

    load_error = None
    try:
        spec = build_spec(spec)
    except Exception as e:
        load_error = str(e)

    if not load_error:
        try:
            target = json.loads(target_input)
        except json.JSONDecodeError:
            try:
                target = ast.literal_eval(target_input)
            except SyntaxError:
                load_error = "Target must JSON or Python literal."

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


def run_click(e):
    run()


def run_enter(e):
    if e.key == 'Enter' and e.ctrlKey:
        e.preventDefault()
        e.stopPropagation()
        run()
        return False
    return True


# run_button.element.onclick = run_click
# spec_box.element.onkeydown = run_enter

run()
js.createObject(create_proxy(globals()), "pyg")

