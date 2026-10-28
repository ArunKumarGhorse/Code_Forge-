from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient

from .fixes import make_diff, validate, get_issue_context, splice_code
from .ml import ml_findings
from .models import Analysis, Issue


class CodeForgePipelineTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_make_diff(self):
        """Verifies make_diff generates unified diff lines starting with + and -."""
        old = "def hello():\n    print('old')\n"
        new = "def hello():\n    print('new')\n"
        diff = make_diff(old, new)
        self.assertIn("-    print('old')", diff)
        self.assertIn("+    print('new')", diff)
        self.assertNotIn("+++", diff)
        self.assertNotIn("---", diff)

    def test_get_issue_context_and_splice(self):
        """Verifies AST extracts the enclosing function and splice_code cleanly replaces it."""
        code = (
            "import os\n\n"
            "def target_func(x):\n"
            "    return x + 1\n\n"
            "def other_func():\n"
            "    pass\n"
        )
        snippet, start, end = get_issue_context(code, target_line=4)
        self.assertIn("def target_func(x):", snippet)
        self.assertEqual(start, 3)
        self.assertEqual(end, 4)

        replacement = "def target_func(x):\n    return x + 2\n"
        spliced = splice_code(code, replacement, start, end)
        self.assertIn("return x + 2", spliced)
        self.assertIn("def other_func():", spliced)

    def test_validate_passes_when_target_rule_count_drops(self):
        """Valid fix passes syntax, drops target rule count, and introduces no new issues."""
        code_with_unused = "import sys\nimport os\nprint(os.getcwd())\n"
        analysis = Analysis.objects.create(code=code_with_unused, filename="sample.py")
        issue = Issue.objects.create(
            analysis=analysis,
            title="Unused import sys",
            severity="low",
            confidence=0.99,
            line=1,
            rule="F401",
            source="Ruff",
        )
        fixed_code = "import os\nprint(os.getcwd())\n"
        result = validate(issue, fixed_code)
        self.assertEqual(result, "validated")

    def test_validate_fails_on_syntax_error(self):
        """Fix with invalid Python syntax must evaluate to 'failed'."""
        analysis = Analysis.objects.create(code="print('hello')", filename="sample.py")
        issue = Issue.objects.create(
            analysis=analysis,
            title="Syntax issue",
            severity="high",
            confidence=0.9,
            line=1,
            rule="F401",
            source="Ruff",
        )
        broken_code = "def broken(\n"
        result = validate(issue, broken_code)
        self.assertEqual(result, "failed")

    def test_validate_fails_when_target_rule_not_dropped(self):
        """If the target rule remains in the new code, validation must fail."""
        code_with_unused = "import sys\nimport os\nprint(os.getcwd())\n"
        analysis = Analysis.objects.create(code=code_with_unused, filename="sample.py")
        issue = Issue.objects.create(
            analysis=analysis,
            title="Unused import sys",
            severity="low",
            confidence=0.99,
            line=1,
            rule="F401",
            source="Ruff",
        )
        # sys is still unused here
        not_fixed_code = "import sys\nimport os\nprint(os.name)\n"
        result = validate(issue, not_fixed_code)
        self.assertEqual(result, "failed")

    def test_validate_ml_issue_always_incomplete(self):
        """Per Rule 4, ML issues can never be validated and must return 'incomplete'."""
        analysis = Analysis.objects.create(code="def risky(): pass", filename="sample.py")
        ml_issue = Issue.objects.create(
            analysis=analysis,
            title="Risky function",
            severity="medium",
            confidence=0.75,
            line=1,
            rule="ML-VULN",
            source="ML model (unverified)",
        )
        result = validate(ml_issue, "def risky(): pass\n")
        self.assertEqual(result, "incomplete")

    def test_ml_findings_on_sample_code(self):
        """Verifies that the ML model scores functions without crashing."""
        sample_code = (
            "def safe_calc(a, b):\n"
            "    return a + b\n\n"
            "def risky_run(cmd):\n"
            "    import os\n"
            "    return os.system(cmd)\n"
        )
        findings = list(ml_findings(sample_code))
        self.assertIsInstance(findings, list)
        for name, start, score in findings:
            self.assertIsInstance(name, str)
            self.assertIsInstance(start, int)
            self.assertIsInstance(score, float)
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 1.0)

    def test_create_analysis_empty_code_returns_400(self):
        """Submitting empty code to /api/analyses/ returns 400 Bad Request."""
        res = self.client.post("/api/analyses/", {"code": "   "}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json(), {"error": "Code is empty"})

    @patch("analysis.views.GeminiProvider")
    def test_generate_fix_with_mocked_ai(self, mock_gemini_cls):
        """Tests generate_fix endpoint with mocked AI provider (no real network calls)."""
        instance = mock_gemini_cls.return_value
        instance.generate_fix.return_value = {
            "why": "Unused imports add noise to code.",
            "how": "Remove unused import.",
            "fixed_code": "import os\nprint(os.getcwd())",
        }

        analysis = Analysis.objects.create(
            code="import sys\nimport os\nprint(os.getcwd())\n",
            filename="sample.py",
        )
        issue = Issue.objects.create(
            analysis=analysis,
            title="`sys` imported but unused",
            severity="low",
            confidence=0.99,
            line=1,
            rule="F401",
            source="Ruff",
        )

        res = self.client.post(f"/api/issues/{issue.id}/generate-fix/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], issue.id)
        self.assertEqual(data["validation"], "validated")
        self.assertIn("-import sys", data["fix_diff"])
        self.assertEqual(data["why"], "Unused imports add noise to code.")
