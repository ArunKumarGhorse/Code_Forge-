import json
from unittest.mock import patch, MagicMock
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

    def test_compiler_languages_endpoint(self):
        """Verifies GET /api/compiler/languages/ returns supported languages and presets."""
        res = self.client.get("/api/compiler/languages/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("languages", data)
        self.assertIn("templates", data)
        self.assertIn("presets", data)
        lang_ids = [l["id"] for l in data["languages"]]
        self.assertIn("python", lang_ids)
        self.assertIn("cpp", lang_ids)

    def test_compiler_run_python_single(self):
        """Tests POST /api/compiler/run/ with single input string."""
        code = "import sys\nname = sys.stdin.read().strip()\nprint(f'Hello {name}!')\n"
        res = self.client.post("/api/compiler/run/", {
            "code": code,
            "language": "python",
            "stdin": "CodeForge"
        }, format="json")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertIn("Hello CodeForge!", data["stdout"])
        self.assertGreaterEqual(data["time_ms"], 0.0)

    def test_compiler_run_python_testcases(self):
        """Tests batch custom testcases judging with Accepted and Wrong Answer."""
        code = "import sys\nt = int(sys.stdin.readline())\nprint(t * 2)\n"
        testcases = [
            {"id": 1, "input": "5", "expected_output": "10"},
            {"id": 2, "input": "12", "expected_output": "24"},
            {"id": 3, "input": "3", "expected_output": "99"}, # Intentional wrong expected
        ]
        res = self.client.post("/api/compiler/run/", {
            "code": code,
            "language": "python",
            "testcases": testcases
        }, format="json")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["verdict"], "Wrong Answer")
        self.assertEqual(data["total_tests"], 3)
        self.assertEqual(data["passed_tests"], 2)
        self.assertEqual(data["failed_tests"], 1)

    def test_compiler_run_tle(self):
        """Tests infinite loop triggering Time Limit Exceeded."""
        code = "while True: pass\n"
        res = self.client.post("/api/compiler/run/", {
            "code": code,
            "language": "python",
            "timeout": 0.5
        }, format="json")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "TLE")

    def test_compiler_complexity_analysis(self):
        """Tests POST /api/compiler/complexity/ static complexity estimation."""
        code_linear = (
            "def solve(nums, target):\n"
            "    seen = {}\n"
            "    for i, x in enumerate(nums):\n"
            "        if target - x in seen:\n"
            "            return [seen[target - x], i]\n"
            "        seen[x] = i\n"
            "    return []\n"
        )
        res = self.client.post("/api/compiler/complexity/", {
            "code": code_linear,
            "language": "python"
        }, format="json")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["time_complexity"], "O(N)")
        self.assertEqual(data["space_complexity"], "O(N)")
        self.assertIn("competitive_verdict", data)

    def test_chatbot_validation(self):
        """Tests POST /api/chatbot/ input validation."""
        res = self.client.post("/api/chatbot/", {}, format="json")
        self.assertEqual(res.status_code, 400)

        res2 = self.client.post("/api/chatbot/", {"messages": [{"role": "user", "content": ""}]}, format="json")
        self.assertEqual(res2.status_code, 400)

    @patch("urllib.request.urlopen")
    def test_chatbot_mocked_success(self, mock_urlopen):
        """Tests POST /api/chatbot/ with mocked Gemini response."""
        import io
        fake_gemini_resp = json.dumps({
            "candidates": [{
                "content": {
                    "parts": [{"text": "SQL injection can be prevented using parameterized queries."}]
                }
            }]
        }).encode("utf-8")

        mock_cm = MagicMock()
        mock_cm.__enter__.return_value = io.BytesIO(fake_gemini_resp)
        mock_urlopen.return_value = mock_cm

        with patch.dict("os.environ", {"GEMINI_API_KEY": "fake_test_key"}):
            res = self.client.post("/api/chatbot/", {
                "messages": [{"role": "user", "content": "How to prevent SQL injection?"}]
            }, format="json")

        self.assertEqual(res.status_code, 200)
        self.assertIn("parameterized queries", res.json()["reply"])

    def test_user_registration_and_login_tables(self):
        """Tests that registration and login properly record into UserProfile and LoginRecord tables."""
        from analysis.models import UserProfile, LoginRecord

        # 1. Register a new user
        reg_payload = {
            "email": "testuser@example.com",
            "username": "testuser",
            "name": "Test User",
            "password": "ValidPassword123!"
        }
        res_reg = self.client.post("/api/auth/register/", reg_payload, format="json")
        self.assertEqual(res_reg.status_code, 201)
        reg_data = res_reg.json()
        self.assertIn("token", reg_data)

        # Verify UserProfile was created
        profile = UserProfile.objects.filter(user__username="testuser").first()
        self.assertIsNotNone(profile)
        self.assertEqual(profile.name, "Test User")

        # Verify LoginRecord table has REGISTER event
        reg_record = LoginRecord.objects.filter(identifier="testuser@example.com", action="REGISTER").first()
        self.assertIsNotNone(reg_record)
        self.assertEqual(reg_record.status, "SUCCESS")

        # 2. Login as the newly created user
        login_payload = {
            "email": "testuser@example.com",
            "password": "ValidPassword123!"
        }
        res_login = self.client.post("/api/auth/login/", login_payload, format="json")
        self.assertEqual(res_login.status_code, 200)
        token = res_login.json()["token"]

        # Verify LoginRecord table has LOGIN event
        login_record = LoginRecord.objects.filter(identifier="testuser@example.com", action="LOGIN").first()
        self.assertIsNotNone(login_record)
        self.assertEqual(login_record.status, "SUCCESS")

        # 3. Check registered users table endpoint
        res_users = self.client.get("/api/auth/users/")
        self.assertEqual(res_users.status_code, 200)
        users_list = res_users.json()
        usernames = [u["username"] for u in users_list]
        self.assertIn("testuser", usernames)

        # 4. Check login records table endpoint
        res_records = self.client.get("/api/auth/records/")
        self.assertEqual(res_records.status_code, 200)
        self.assertTrue(len(res_records.json()) >= 2)

    @patch("threading.Thread")
    def test_new_user_dashboard_reset_and_user_scoped_scans(self, mock_thread):
        """Tests that a brand new user starts with 0 scans / reset dashboard, and analyses are user-scoped."""
        # Mock thread to run synchronously or skip background analysis
        mock_thread.return_value.start.side_effect = lambda: None
        # 1. Register new user
        reg_payload = {
            "email": "freshuser@example.com",
            "username": "freshuser",
            "name": "Fresh User",
            "password": "PasswordStrong999!"
        }
        res = self.client.post("/api/auth/register/", reg_payload, format="json")
        token = res.json()["token"]

        # 2. Query dashboard with new user's auth token
        dash_res = self.client.get("/api/dashboard/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.json()

        # Stats must be completely reset for this new user!
        self.assertEqual(dash_data["total_scans"], 0)
        self.assertEqual(dash_data["total"], 0)
        self.assertEqual(dash_data["security_score"], 100)
        self.assertEqual(dash_data["security_grade"], "A+")
        self.assertEqual(len(dash_data["recent"]), 0)

        # 3. User creates an analysis
        code = "def add(a, b):\n    return a + b\n"
        create_res = self.client.post(
            "/api/analyses/",
            {"filename": "math_helper.py", "code": code},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(create_res.status_code, 201)
        analysis_id = create_res.json()["id"]

        # 4. Query dashboard again — now user has 1 scan!
        dash_res_after = self.client.get("/api/dashboard/", HTTP_AUTHORIZATION=f"Bearer {token}")
        dash_data_after = dash_res_after.json()
        self.assertEqual(dash_data_after["total_scans"], 1)
        self.assertEqual(len(dash_data_after["recent"]), 1)
        self.assertEqual(dash_data_after["recent"][0]["id"], analysis_id)

        # 5. Verify GET /api/analyses/ also returns only this user's scans
        history_res = self.client.get("/api/analyses/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(history_res.status_code, 200)
        self.assertEqual(len(history_res.json()), 1)
        self.assertEqual(history_res.json()[0]["id"], analysis_id)



