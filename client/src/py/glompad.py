
import ast
import json
import time
import pprint

import js
from pyodide.ffi import create_proxy

import glom
import black

# TODO: try dataclasses here again. 
# First time it seemed to introduce a delay, possibly due to eval/compilation.
class InputStatus:
    def __init__(self, kind, title, subtitle='', detail='', timing=-0.0, start_time=None):
        self.title = title
        self.subtitle = subtitle
        self.detail = detail
        self.timing = timing
        self.kind = kind
        if not self.timing and start_time is not None:
            self.timing = time.time() - start_time

    @classmethod
    def success(cls, **kw):
        if not kw.get('title'):
            kw['title'] = 'OK'
        return cls(kind='success', **kw)

    @classmethod
    def warning(cls, *a, **kw):
        if not kw.get('title'):
            kw['title'] = 'Warning'
        return cls(kind='warning', *a, **kw)

    @classmethod
    def error(cls, *a, **kw):
        if not kw.get('title'):
            kw['title'] = 'Error'
        return cls(kind='error', *a, **kw)

    def to_dict(self):
        return dict(self.__dict__)

    def store(self, svelte_store):
        proxy = create_proxy(self.to_dict());
        svelte_store.setProxy(proxy)
        return


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
        load_error = str(e)
        InputStatus.error(detail=load_error, start_time=start_time).store(padStore.specStatus)
    else:
        InputStatus.success(start_time=start_time).store(padStore.specStatus)

    try:
        start_time = time.time()
        scope = build_spec(scope_val) if scope_val.strip() else None
        if scope:
            glom_kwargs['scope'] = scope
    except Exception as e:
        load_error = str(e)
        InputStatus.error(detail=load_error, start_time=start_time).store(padStore.scopeStatus)
    else:
        InputStatus.success(start_time=start_time).store(padStore.scopeStatus)

    if not load_error:
        try:
            start_time = time.time()
            target = json.loads(target_input)
        except json.JSONDecodeError as jde:
            # js.window.console.log(repr(jde))
            try:
                start_time = time.time()
                target = ast.literal_eval(target_input)
            except SyntaxError as se:
                load_error = f"Target must JSON or Python literal.\n\n{se}"
                InputStatus.error(detail=load_error, start_time=start_time).store(padStore.targetStatus)
            else:
                # TODO: subtitle
                InputStatus.success(subtitle="Python", start_time=start_time).store(padStore.targetStatus)
        else:
            InputStatus.success(subtitle="JSON", start_time=start_time).store(padStore.targetStatus)

    if not load_error:
        try:
            start_time = time.time()
            result = glom.glom(target, spec, **glom_kwargs)
            # TODO: if the above was json, try to json it first
            result = pprint.pformat(result)
            if enable_autoformat:
                result = autoformat(result)
        except glom.GlomError as ge:
            err = str(ge)
            result = err
            InputStatus.error(title=type(ge).__name__, detail=err, start_time=start_time).store(padStore.resultStatus)
            padStore.resultValue.set(err)
        else:
            InputStatus.success(start_time=start_time).store(padStore.resultStatus)
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
    return black.format_str(code, mode=black.Mode(line_length=50))

run()
js.createObject(create_proxy(globals()), "pyg")

