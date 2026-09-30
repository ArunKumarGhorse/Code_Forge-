import json
import os
import subprocess
import sys
import tempfile

from .models import Analysis, Issue

BANDIT_SEVERITY = {"HIGH": "high", "MEDIUM": "medium", "LOW": "low"}
BANDIT_CONFIDENCE = {"HIGH": 0.9, "MEDIUM": 0.7, "LOW": 0.5}


def _run(cmd):
    # Sirf static tools chalte hain. Uploaded code kabhi execute nahi hota.
    return subprocess.run(cmd, capture_output=True, text=True, timeout=30).stdout


def run_analysis(analysis_id):
    analysis = Analysis.objects.get(id=analysis_id)
    analysis.status = "RUNNING"
    analysis.stage = 3  # "Static analysis"
    analysis.save()
    try:
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "code.py")
            with open(path, "w", encoding="utf-8") as f:
                f.write(analysis.code)

            ruff = json.loads(_run([sys.executable, "-m", "ruff", "check", path, "--output-format", "json"]) or "[]")
            for r in ruff:
                Issue.objects.create(
                    analysis=analysis,
                    title=r["message"],
                    severity="high" if r["code"] is None else "low",  # code None = syntax error
                    confidence=0.99,
                    line=r["location"]["row"],
                    rule=r["code"] or "SYNTAX",
                    source="Ruff",
                    what=r["message"],
                )

            bandit = json.loads(_run([sys.executable, "-m", "bandit", "-f", "json", "-q", path]) or "{}")
            for b in bandit.get("results", []):
                Issue.objects.create(
                    analysis=analysis,
                    title=b["issue_text"],
                    severity=BANDIT_SEVERITY[b["issue_severity"]],
                    confidence=BANDIT_CONFIDENCE[b["issue_confidence"]],
                    line=b["line_number"],
                    rule=b["test_id"],
                    source="Bandit",
                    what=b["issue_text"],
                )
        analysis.status = "COMPLETED"
        analysis.stage = 7
    except Exception as e:
        print("Analysis failed:", e)  # terminal mein error dikhega
        analysis.status = "FAILED"
    analysis.save()