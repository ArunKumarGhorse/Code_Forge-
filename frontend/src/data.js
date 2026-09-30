// MOCK DATA — replace with Django API calls (GET /api/analyses/:id/issues/ etc.)
export const SEV = { critical: 'crit', high: 'high', medium: 'med', low: 'low', info: 'info' }
export const ORDER = ['critical', 'high', 'medium', 'low']

export const FILE = {
  name: 'app/login.py',
  code: `import sqlite3, hashlib, subprocess
SECRET_KEY = "sk_live_51H8xExampleKey"

def login(username, password):
    conn = sqlite3.connect("app.db")
    query = "SELECT * FROM users WHERE name='" + username + "'"
    user = conn.execute(query).fetchone()
    if user and user[2] == hashlib.md5(password.encode()).hexdigest():
        return user
    return None

def backup(path):
    subprocess.call("tar -czf backup.tgz " + path, shell=True)

def parse(data):
    import os
    result = eval(data)
    return result
`,
}

const ok = ['Syntax', 'pass']
export const ISSUES = [
  { id: 1, title: 'Hardcoded secret in source', severity: 'critical', confidence: 0.88, line: 2, rule: 'B105', source: 'Bandit',
    what: 'A live-looking API key is stored directly in the source file.',
    why: 'Anyone with repository access can read it, and it stays in git history even after deletion.',
    how: 'Load it from an environment variable and rotate the exposed key.', fix: null, validation: null },
  { id: 2, title: 'Possible SQL injection', severity: 'high', confidence: 0.94, line: 6, rule: 'B608', source: 'Bandit',
    what: 'The query is built by concatenating the username into the SQL string.',
    why: 'A crafted username can change the query and bypass login or leak rows.',
    how: 'Use a parameterized query so the driver escapes the value.',
    fix: `- query = "SELECT * FROM users WHERE name='" + username + "'"\n- user = conn.execute(query).fetchone()\n+ query = "SELECT * FROM users WHERE name = ?"\n+ user = conn.execute(query, (username,)).fetchone()`,
    validation: { status: 'validated', checks: [ok, ['Ruff', 'pass'], ['Bandit re-scan', 'pass']] } },
  { id: 3, title: 'Weak hash used for passwords (MD5)', severity: 'medium', confidence: 0.91, line: 8, rule: 'B324', source: 'Bandit',
    what: 'Passwords are compared using an unsalted MD5 hash.',
    why: 'MD5 is fast to brute-force, so leaked hashes are easy to crack.',
    how: 'Use a slow salted hash such as bcrypt or argon2.', fix: null, validation: null },
  { id: 4, title: 'Shell command built from input', severity: 'high', confidence: 0.86, line: 13, rule: 'B602', source: 'Bandit',
    what: 'subprocess is called with shell=True and a concatenated path.',
    why: 'A path like "x; rm -rf ~" would run extra commands.',
    how: 'Pass an argument list and drop shell=True.', fix: null, validation: null },
  { id: 5, title: 'Use of eval on external data', severity: 'high', confidence: 0.9, line: 17, rule: 'B307', source: 'Bandit',
    what: 'eval() executes whatever string is passed to parse().',
    why: 'It allows arbitrary code execution if the data is user-controlled.',
    how: 'Use ast.literal_eval or json.loads.', fix: null, validation: null },
  { id: 6, title: 'Unused import: os', severity: 'low', confidence: 0.99, line: 16, rule: 'F401', source: 'Ruff',
    what: '`os` is imported but never used.', why: 'Dead imports add noise and slow readers down.',
    how: 'Remove the import.', fix: `- import os`,
    validation: { status: 'incomplete', checks: [ok, ['Ruff', 'pass'], ['Tests', 'skip']] } },
  { id: 7, title: 'login() looks vulnerable', severity: 'medium', confidence: 0.71, line: 4, rule: 'ML-VULN', source: 'ML model (unverified)',
    what: 'The function resembles vulnerable authentication code seen in training data.',
    why: 'This is a statistical prediction, not a confirmed finding.',
    how: 'Review the login flow manually; see the SQL injection finding.', fix: null, validation: null },
]

export const RECENT = [
  { project: 'student-management', source: 'GitHub', langs: 'Python, JS', issues: 24, status: 'COMPLETED', when: '2 hours ago' },
  { project: 'api-gateway.zip', source: 'ZIP', langs: 'Go', issues: 9, status: 'COMPLETED', when: 'Yesterday' },
  { project: 'notes-app', source: 'GitHub', langs: 'TypeScript', issues: 0, status: 'RUNNING', when: 'Just now' },
]

export const STAGES = ['Uploading', 'Indexing files', 'Detecting languages', 'Static analysis', 'ML analysis', 'AI analysis', 'Generating report']
