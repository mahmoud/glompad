
import ast
import json
import time
import pprint

import js
from pyodide.ffi import create_proxy

import glom
import black

class InputStatus:
    def __init__(self, title, subtitle='', detail='', timing=-0.0):
        self.title = title
        self.subtitle = subtitle
        self.detail = detail
        self.timing = timing

    def to_dict(self):
        return glom.glom(
            self,
            {
                'title': 'title',
                'subtitle': 'subtitle',
                'detail': 'detail',
                'timing': 'timing',
            }
        )


def get_store_value(store):
    "Get the current value of a Svelte store."
    ret = None
    def set_ret(val):
        nonlocal ret
        ret = val
    unsub = store.subscribe(set_ret)
    unsub()
    return ret


def set_status(store, **kwargs):
    start_time = kwargs.pop('start_time', None)
    if start_time and not kwargs.get('timing'):
        kwargs['timing'] = time.time() - start_time
    status = InputStatus(**kwargs)
    proxy = create_proxy(status.to_dict());
    store.setProxy(proxy)
    return status


def run():
    js.createObject(create_proxy(globals()), "pyg")
    glom_kwargs = {}
    padStore = js.window.SvelteApp.padStore

    stateStack = get_store_value(padStore.stateStack)
    spec_val = glom.glom(stateStack, glom.T[0].specValue, default='').strip()
    scope_val = glom.glom(stateStack, glom.T[0].scopeValue, default='').strip()
    target_input = glom.glom(stateStack, glom.T[0].targetValue, default='').strip()

    enable_autoformat = bool(get_store_value(padStore.enableAutoformat))

    load_error = None
    try:
        start_time = time.time()
        spec = build_spec(spec_val)
    except Exception as e:
        set_status(padStore.specStatus, title="Error", detail=str(e), start_time=start_time)
    else:
        set_status(padStore.specStatus, title="OK", start_time=start_time)

    try:
        start_time = time.time()
        scope = build_spec(scope_val) if scope_val.strip() else None
        if scope:
            glom_kwargs['scope'] = scope
    except Exception as e:
        load_error = str(e)
        set_status(padStore.scopeStatus, title="Error", detail=load_error, start_time=start_time)
    else:
        set_status(padStore.scopeStatus, title="OK", start_time=start_time)

    if not load_error:
        try:
            start_time = time.time()
            target = json.loads(target_input)
        except json.JSONDecodeError as jde:
            # js.window.console.log(repr(jde))
            try:
                start_time = time.time()
                target = ast.literal_eval(target_input)
            except SyntaxError:
                load_error = "Target must JSON or Python literal."
                set_status(padStore.targetStatus, title="Error", detail=load_error, start_time=start_time)
            else:
                # TODO: subtitle
                set_status(padStore.targetStatus, title="OK: Python", detail=load_error, start_time=start_time)
        else:
            set_status(padStore.targetStatus, title="OK: JSON", detail=load_error, start_time=start_time)

    if not load_error:
        try:
            start_time = time.time()
            result = glom.glom(target, spec, **glom_kwargs)
            result = pprint.pformat(result)
            if enable_autoformat:
                result = autoformat(result)
        except glom.GlomError as ge:
            err = str(ge)
            result = err
            set_status(padStore.resultStatus, title=type(ge).__name__, detail=err, start_time=start_time)
            padStore.resultValue.set(err)
        else:
            set_status(padStore.resultStatus, title='OK', start_time=start_time)
            padStore.resultValue.set(result)

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


def autoformat(code):
    return black.format_str(code, mode=black.Mode())

run()
js.createObject(create_proxy(globals()), "pyg")

