# CodeForge 🔨

CodeForge is an intelligent, developer-focused code analyzer and repair tool for Python files. It combines deterministic static analysis (Ruff + Bandit), a machine-learning vulnerability risk-score model, and Google Gemini AI to analyze code, explain issues, generate targeted fixes, and honestly validate them before they are marked safe.

---

## 🚀 Key Features

- **Multi-Layer Analysis Pipeline**:
  - **Static Analysis (Ruff & Bandit)**: Detects syntax errors, code smells, dead imports, and security vulnerabilities (e.g. SQL injection, shell command execution, weak hashing).
  - **Machine Learning Risk Scoring**: AST-based function scoring using a Scikit-Learn model to predict vulnerability risk in functions.
  - **AI Explanations & Auto-Fixes (Gemini)**: Generates clear, non-jargon explanations of *what* is wrong, *why* it matters, and *how* to fix it.
  - **Honest Automated Validation**: Fixes are re-scanned using `compile()`, Ruff, and Bandit. A fix is marked `Validated` **only** if the syntax check passes, the target rule count drops, and no new issues appear.
- **Competitive Programming Compiler & Testing Arena**:
  - **Multi-Language Support**: Run Python 3, C++ (C++17), C (C11), JavaScript (Node.js), and Java.
  - **Custom Test Cases & Judge**: Add, edit, or remove multiple test cases with stdin and optional expected output. Compares actual vs expected outputs, highlights diffs, and computes verdicts (`Accepted`, `Wrong Answer`, `Time Limit Exceeded`, `Runtime Error`, `Compilation Error`).
  - **Empirical Execution Metrics**: Measures real wall-clock execution time (ms) and peak memory consumption (MB).
  - **Asymptotic Time & Space Complexity Engine**: Analyzes Big-O Time Complexity ($O(1)$, $O(\log N)$, $O(N)$, $O(N \log N)$, $O(N^2)$, $O(2^N)$) and Space Complexity ($O(1)$, $O(N)$, $O(N^2)$), provides best/worst-case breakdowns, and checks competitive programming feasibility (e.g. $N \le 10^5$ constraints under 1.0s limit).
  - **Classic CP Problem Presets**: Built-in templates for Two Sum, Maximum Subarray (Kadane's), and Valid Parentheses.
- **Developer Experience**:
  - Interactive Monaco Code Editor with error markers and line-highlighting.
  - Interactive unified diff viewer (`+` additions, `-` deletions).
  - Single-click **Apply Fix**, **Reject**, or **Ignore**, persisted directly to the database.
  - Support for `.py` file drag-and-drop upload (up to 200 KB) and direct code pasting.
  - Dark and Light themes.

---

## 🏗️ Architecture

```
CodeForge
├── codeforge-backend (Django 4.2, DRF, SQLite, Python 3.9)
│   ├── analysis/
│   │   ├── ai.py         # AIProvider abstraction & GeminiProvider (urllib-based, prompt guard)
│   │   ├── fixes.py      # AST context extraction, splicing, diff generation & honest validation
│   │   ├── ml.py         # AST function extraction & Scikit-Learn risk inference
│   │   ├── runner.py     # Background thread runner for Ruff, Bandit & ML pipeline
│   │   ├── compiler.py   # Multi-language compiler, testcases judge & complexity engine
│   │   ├── models.py     # Analysis and Issue models (with status, fixed_code, validation)
│   │   ├── serializers.py# DRF ModelSerializers
│   │   ├── views.py      # REST API endpoints (analyses, issues, generate-fix, compiler, dashboard)
│   │   ├── urls.py       # API routing under /api/
│   │   └── tests.py      # Comprehensive automated unit test suite
│   ├── config/           # Django settings, URLs, WSGI/ASGI
│   └── model.joblib      # Trained vulnerability classification model
└── frontend (Vite, React 18)
    ├── src/
    │   ├── App.jsx       # Theme provider and main layout
    │   ├── Compiler.jsx  # Multi-language CP compiler, testcases runner & complexity UI
    │   ├── Dashboard.jsx # Real metrics (severity breakdown, tool vs ML counts, recent runs)
    │   ├── NewAnalysis.jsx# .py file upload & paste code interfaces
    │   ├── Results.jsx   # Split view: Monaco Editor + Issue list + Diff & Fix actions
    │   └── index.css     # Clean design system with CSS custom properties
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Python 3.9**
- **Node.js 18+** & `npm`
- A Google Gemini API key

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd codeforge-backend

# Create and activate Python 3.9 virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template and add your Gemini API key
cp .env.example .env
# Open .env and set: GEMINI_API_KEY=your_actual_key_here

# Run database migrations
python manage.py migrate

# Start Django development server (runs on http://127.0.0.1:8000)
python manage.py runserver
```

### 2. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server (proxies /api to http://localhost:8000)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📊 Machine Learning Model Metrics

The ML model (`analysis/model.joblib`) parses Python code into an Abstract Syntax Tree (AST), extracts function-level syntactic and structural features, and predicts whether a function resembles historically vulnerable code patterns.

### Evaluation Metrics (Vulnerable Class):
| Metric | Score |
|---|---|
| **Precision** | `0.71` |
| **Recall** | `0.55` |
| **F1-Score** | `0.62` |
| **ROC-AUC** | `0.888` |
| **PR-AUC** | `0.68` |

---

## 🛡️ Hard Rules & Honest Limitations

1. **Static Analysis & Safety First**:
   - Uploaded or pasted code is **never executed**. Only static tools (`ruff`, `bandit`) and `compile()` for syntax verification are run in isolated temporary files.
2. **Statistical ML Predictions**:
   - The ML model outputs a **statistical probability**, not a confirmed vulnerability. In the UI, ML findings are explicitly labeled as *"ML model (unverified)"*.
   - Per our honesty guidelines, ML findings can **never** be marked as `"Validated"` (they evaluate to `"Validation incomplete"`).
3. **No Hallucinated Fixes & Prompt Injection Guard**:
   - Code sent to the Gemini API is enclosed in strict boundary tags (`<<<CODE_SNIPPET_START>>>`) and treated strictly as plain text data. The model is explicitly barred from following any instructions embedded within user code comments or strings.
   - If a snippet cannot be safely fixed without broader cross-file context, the system reports `"Insufficient context to safely generate a fix."` rather than guessing.
4. **Scope**:
   - CodeForge currently supports **single Python (.py) files** up to 200 KB. Multi-file repositories and non-Python languages are outside the scope of this project.

---

## 🧪 Running Automated Tests

To run the automated test suite (including validation tests, `make_diff`, ML inference, and API mock tests):

```bash
cd codeforge-backend
venv/bin/python manage.py test analysis
```
