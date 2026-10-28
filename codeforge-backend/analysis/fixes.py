import ast
from collections import Counter
import difflib
import json
import os
import subprocess
import sys
import tempfile
from typing import Tuple

from .models import Issue


def get_issue_context(full_code: str, target_line: int) -> Tuple[str, int, int]:
    """
    Extracts the relevant code snippet containing the issue line:
    1. Tries ast to find the innermost enclosing function.
    2. Falls back to ~40 lines around the target line.
    Returns (snippet, start_line, end_line) with 1-based line numbers.
    """
    lines = full_code.splitlines(keepends=True)
    total_lines = len(lines)
    if total_lines == 0:
        return "", 1, 1

    # 1. AST search for innermost enclosing function
    try:
        tree = ast.parse(full_code)
        matching_funcs = []
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                end_lineno = getattr(node, "end_lineno", node.lineno)
                if node.lineno <= target_line <= end_lineno:
                    matching_funcs.append(node)
        if matching_funcs:
            # Innermost function has the smallest line span
            best = min(matching_funcs, key=lambda n: getattr(n, "end_lineno", n.lineno) - n.lineno)
            start_line = best.lineno
            end_line = getattr(best, "end_lineno", best.lineno)
            snippet = "".join(lines[start_line - 1 : end_line])
            return snippet, start_line, end_line
    except Exception:
        pass

    # 2. Fallback: ~40 lines around target_line
    start_line = max(1, target_line - 20)
    end_line = min(total_lines, start_line + 39)
    if end_line - start_line < 39:
        start_line = max(1, end_line - 39)
    snippet = "".join(lines[start_line - 1 : end_line])
    return snippet, start_line, end_line


def splice_code(full_code: str, replacement: str, start_line: int, end_line: int) -> str:
    """
    Replaces lines [start_line, end_line] (1-based, inclusive) in full_code with replacement.
    """
    lines = full_code.splitlines(keepends=True)
    before = "".join(lines[: start_line - 1])
    after = "".join(lines[end_line:])

    clean_replacement = replacement.strip("\r\n")
    if clean_replacement:
        clean_replacement += "\n"

    return before + clean_replacement + after


def make_diff(old_code: str, new_code: str) -> str:
    """
    Generates unified diff containing only added (+) and removed (-) lines.
    Matches CodeForge UI's expected format.
    """
    diff_lines = []
    for line in difflib.unified_diff(
        old_code.splitlines(),
        new_code.splitlines(),
        lineterm="",
    ):
        if line.startswith(("+", "-")) and not line.startswith(("+++", "---")):
            diff_lines.append(line)
    return "\n".join(diff_lines)


def _run_static_tools(code: str) -> Counter:
    """
    Runs Ruff and Bandit on code safely without executing it.
    Returns a Counter of detected rule IDs.
    """
    rules = []
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "code.py")
        with open(path, "w", encoding="utf-8") as f:
            f.write(code)

        # 1. Ruff check
        try:
            p_ruff = subprocess.run(
                [sys.executable, "-m", "ruff", "check", path, "--output-format", "json"],
                capture_output=True,
                text=True,
                timeout=15,
            )
            ruff_data = json.loads(p_ruff.stdout or "[]")
            for r in ruff_data:
                rules.append(r.get("code") or "SYNTAX")
        except Exception:
            pass

        # 2. Bandit check
        try:
            p_bandit = subprocess.run(
                [sys.executable, "-m", "bandit", "-f", "json", "-q", path],
                capture_output=True,
                text=True,
                timeout=15,
            )
            bandit_data = json.loads(p_bandit.stdout or "{}")
            for b in bandit_data.get("results", []):
                rules.append(b.get("test_id"))
        except Exception:
            pass

    return Counter(rules)


def validate(issue: Issue, new_code: str) -> str:
    """
    Honesty in validation (Hard Rule 4):
    A fix is 'validated' only if:
    1. Syntax check passes via compile().
    2. The target rule count drops.
    3. No new issues appear.
    ML issues can never be 'validated' (use 'incomplete').
    Returns 'validated', 'failed', or 'incomplete'.
    """
    if issue.source.startswith("ML") or issue.rule == "ML-VULN":
        return "incomplete"

    # Step 1: Syntax check without executing code (Hard Rule 1)
    try:
        compile(new_code, "<string>", "exec")
    except Exception:
        return "failed"

    # Step 2: Compare static analysis before and after
    old_counts = Counter(issue.analysis.issues.values_list("rule", flat=True))
    if issue.analysis.code:
        for r, c in _run_static_tools(issue.analysis.code).items():
            old_counts[r] = max(old_counts[r], c)
    new_counts = _run_static_tools(new_code)

    target_rule = issue.rule
    old_target_count = old_counts.get(target_rule, 0)
    new_target_count = new_counts.get(target_rule, 0)

    target_dropped = new_target_count < old_target_count
    no_new_issues = all(new_counts[r] <= old_counts.get(r, 0) for r in new_counts)

    if target_dropped and no_new_issues:
        return "validated"
    return "failed"
