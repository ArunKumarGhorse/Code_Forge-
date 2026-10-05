import ast
import os

import joblib

_BUNDLE = None


def _load():
    global _BUNDLE
    if _BUNDLE is None:
        _BUNDLE = joblib.load(os.path.join(os.path.dirname(__file__), "model.joblib"))
    return _BUNDLE


def ml_findings(code):
    """Returns (name, start_line, probability) for functions the model flags."""
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return []
    lines = code.splitlines()
    funcs = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
    if not funcs:
        return []
    snippets = ["\n".join(lines[n.lineno - 1:n.end_lineno]) for n in funcs]
    bundle = _load()
    probs = bundle["model"].predict_proba(snippets)[:, 1]
    return [(n.name, n.lineno, float(p)) for n, p in zip(funcs, probs) if p >= bundle["threshold"]]
    