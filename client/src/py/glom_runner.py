"""
Pure-function glom executor for the Pyodide web worker.

No JS imports, no DOM access, no store manipulation.
Receives structured input, returns structured output as a dict.
"""

import ast
import json
import time
import pprint
import traceback

import glom
import black


def build_spec(spec_str):
    """Parse a spec string into a glom spec object.

    Tries eval with glom's namespace first (for glom types like T, Iter, etc.),
    falls back to treating as a dotted-path string.
    """
    try:
        return eval(spec_str, dict(glom.__dict__))
    except NameError:
        # Probably a dotted-path string, strip comments
        return spec_str.partition('#')[0]
    except SyntaxError:
        raise


def load_target(target_str):
    """Parse a target string as JSON or Python literal.

    Returns (target_obj, format_str) on success.
    format_str is 'json' or 'python'.
    Raises ValueError on parse failure.
    """
    # Try JSON first (more common)
    try:
        return json.loads(target_str), 'json'
    except json.JSONDecodeError:
        pass

    # Fall back to Python literal
    try:
        return ast.literal_eval(target_str), 'python'
    except Exception as e:
        tb = ''.join(traceback.format_exception(e))
        raise ValueError(
            f"Target must be a JSON or Python literal.\n\n{tb}"
        ) from e


def autoformat(code):
    """Format Python code using black."""
    return black.format_str(code, mode=black.Mode())


def run_glom(spec_str, target_str, scope_str=None, do_autoformat=False):
    """Execute a glom spec against a target and return a structured result dict.

    This is the main entry point called from the web worker.
    All inputs are strings; all outputs are plain dicts (serializable).
    """
    t_start = time.time()
    result = {
        'status': 'error',
        'result': '',
        'timing': {'parse_ms': 0, 'glom_ms': 0, 'format_ms': 0, 'total_ms': 0},
    }

    # Parse spec
    try:
        t0 = time.time()
        spec = build_spec(spec_str)
        formatted_spec = autoformat(spec_str) if do_autoformat else None
    except Exception as e:
        result['error'] = {
            'type': type(e).__name__,
            'message': str(e),
            'traceback': ''.join(traceback.format_exception(e)),
        }
        result['timing']['total_ms'] = (time.time() - t_start) * 1000
        return result

    # Parse target
    try:
        target, target_format = load_target(target_str)
        formatted_target = None
        if do_autoformat:
            if target_format == 'json':
                formatted_target = json.dumps(target, indent=2)
            else:
                formatted_target = autoformat(target_str)
    except ValueError as e:
        result['error'] = {
            'type': 'TargetParseError',
            'message': str(e),
        }
        result['timing']['total_ms'] = (time.time() - t_start) * 1000
        return result

    # Parse scope (if provided)
    glom_kwargs = {}
    formatted_scope = None
    if scope_str and scope_str.strip():
        try:
            scope = build_spec(scope_str)
            glom_kwargs['scope'] = scope
            if do_autoformat:
                formatted_scope = autoformat(scope_str)
        except Exception as e:
            result['error'] = {
                'type': type(e).__name__,
                'message': str(e),
                'traceback': ''.join(traceback.format_exception(e)),
            }
            result['timing']['total_ms'] = (time.time() - t_start) * 1000
            return result

    t_parse = time.time()
    result['timing']['parse_ms'] = (t_parse - t_start) * 1000

    # Execute glom
    try:
        t1 = time.time()
        glom_result = glom.glom(target, spec, **glom_kwargs)
        t_glom = time.time()
        result['timing']['glom_ms'] = (t_glom - t1) * 1000

        # Format output
        if target_format == 'json':
            try:
                result_str = json.dumps(glom_result, indent=4)
            except (TypeError, ValueError):
                result_str = pprint.pformat(glom_result)
        else:
            result_str = pprint.pformat(glom_result)

        if do_autoformat:
            try:
                result_str = autoformat(result_str)
            except Exception:
                pass  # formatting failure is non-fatal

        t_fmt = time.time()
        result['timing']['format_ms'] = (t_fmt - t_glom) * 1000

        result['status'] = 'success'
        result['result'] = result_str
        result['target_format'] = target_format

        # Include autoformatted inputs for the UI to update
        if do_autoformat:
            formatted = {}
            if formatted_spec is not None:
                formatted['spec'] = formatted_spec
            if formatted_target is not None:
                formatted['target'] = formatted_target
            if formatted_scope is not None:
                formatted['scope'] = formatted_scope
            if formatted:
                result['formatted'] = formatted

    except glom.GlomError as ge:
        t_glom = time.time()
        result['timing']['glom_ms'] = (t_glom - t1) * 1000
        result['error'] = {
            'type': type(ge).__name__,
            'message': str(ge),
        }
        result['result'] = str(ge)

    result['timing']['total_ms'] = (time.time() - t_start) * 1000
    return result
