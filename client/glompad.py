
import ast
import json

import js
from pyodide.ffi import create_proxy

import glom

run_button = Element('run-button')
spec_box = Element('glom-spec-input')
target_box = Element('glom-target-input')
result_box = Element('glom-result-input')

def run():
    js.createObject(create_proxy(globals()), "pyg")

    spec = spec_box.value.strip()
    target_input = target_box.value.strip()

    load_error = None
    try:
        target = json.loads(target_input)
    except json.JSONDecodeError:
        try:
            target = ast.literal_eval(target_input)
        except SyntaxError:
            load_error = "Target must JSON or Python literal."

    if not load_error:
        try:
            result = glom.glom(target, spec)
        except glom.GlomError as ge:
            err = str(ge)
            result = err

    result_box.element.value = load_error or result


def run_event(e):
    run()

run_button.element.onclick = run_event