import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Terminal,
  Code2,
  Zap,
  Timer,
  Layers,
  FileCode2,
  ChevronRight,
  Info
} from 'lucide-react'

const DEFAULT_TEMPLATES = {
  python: `import sys

def solve():
    """
    Competitive Programming Starter (Python 3)
    """
    input_data = sys.stdin.read().split()
    if not input_data:
        print("CodeForge Compiler Ready")
        return

    # Example: N integers
    # n = int(input_data[0])
    # nums = [int(x) for x in input_data[1:]]
    print(f"Read {len(input_data)} tokens")

if __name__ == '__main__':
    solve()
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>

using namespace std;

int main() {
    // Fast I/O for Competitive Programming
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (cin >> n) {
        vector<int> nums(n);
        for (int i = 0; i < n; i++) cin >> nums[i];
        cout << "Successfully read " << n << " elements\\n";
    } else {
        cout << "CodeForge C++ Compiler Ready\\n";
    }

    return 0;
}
`,
  c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("Read %d\\n", n);
    } else {
        printf("CodeForge C Compiler Ready\\n");
    }
    return 0;
}
`,
  javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) {
        console.log("CodeForge JS Compiler Ready");
        return;
    }
    const tokens = input.split(/\\s+/);
    console.log(\`Read \${tokens.length} tokens\`);
}

solve();
`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            System.out.println("Read: " + n);
        } else {
            System.out.println("CodeForge Java Compiler Ready");
        }
    }
}
`
}

const DEFAULT_PRESETS = [
  {
    id: 'custom',
    title: 'Custom Scratchpad',
    difficulty: 'Sandbox',
    description: 'Freely write, run, and test any competitive programming algorithm with custom test cases.',
    templates: DEFAULT_TEMPLATES,
    testcases: [
      { id: 1, name: 'Case 1', input: 'Hello World', expected_output: 'Read 2 tokens' },
      { id: 2, name: 'Case 2', input: '10 20 30 40', expected_output: 'Read 4 tokens' }
    ]
  },
  {
    id: 'two_sum',
    title: 'Two Sum (Hash Map O(N))',
    difficulty: 'Easy',
    description: 'Find indices of two numbers that add up to target. Optimal hash map solution runs in O(N) time and O(N) space.',
    templates: {
      python: `import sys

def two_sum():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    target = int(tokens[1])
    nums = [int(tokens[i]) for i in range(2, 2 + n)]
    
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            print(f"{seen[complement]} {i}")
            return
        seen[num] = i
    print("-1 -1")

if __name__ == '__main__':
    two_sum()
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, target;
    if (!(cin >> n >> target)) return 0;

    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    unordered_map<int, int> seen;
    for (int i = 0; i < n; i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            cout << seen[complement] << " " << i << "\\n";
            return 0;
        }
        seen[nums[i]] = i;
    }
    cout << "-1 -1\\n";
    return 0;
}
`,
      c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n, target;
    if (scanf("%d %d", &n, &target) != 2) return 0;

    int* nums = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) {
                printf("%d %d\\n", i, j);
                free(nums);
                return 0;
            }
        }
    }
    printf("-1 -1\\n");
    free(nums);
    return 0;
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (input.length < 2) return;
    const n = parseInt(input[0], 10);
    const target = parseInt(input[1], 10);
    const nums = input.slice(2, 2 + n).map(x => parseInt(x, 10));

    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (seen.has(comp)) {
            console.log(\`\${seen.get(comp)} \${i}\`);
            return;
        }
        seen.set(nums[i], i);
    }
    console.log("-1 -1");
}

solve();
`
    },
    testcases: [
      { id: 1, name: 'Case 1', input: '4 9\n2 7 11 15', expected_output: '0 1' },
      { id: 2, name: 'Case 2', input: '3 6\n3 2 4', expected_output: '1 2' },
      { id: 3, name: 'Case 3', input: '2 6\n3 3', expected_output: '0 1' }
    ]
  },
  {
    id: 'max_subarray',
    title: "Maximum Subarray (Kadane's O(N))",
    difficulty: 'Medium',
    description: 'Find contiguous subarray with maximum sum. Runs in optimal linear O(N) time and O(1) auxiliary space.',
    templates: {
      python: `import sys

def max_subarray():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    nums = [int(tokens[i]) for i in range(1, 1 + n)]

    current_sum = max_sum = nums[0]
    for x in nums[1:]:
        current_sum = max(x, current_sum + x)
        max_sum = max(max_sum, current_sum)
    print(max_sum)

if __name__ == '__main__':
    max_subarray()
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n) || n <= 0) return 0;

    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    long long current_sum = a[0];
    long long max_sum = a[0];

    for (int i = 1; i < n; i++) {
        current_sum = max(a[i], current_sum + a[i]);
        max_sum = max(max_sum, current_sum);
    }
    cout << max_sum << "\\n";
    return 0;
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, 1 + n).map(x => parseInt(x, 10));

    let current = nums[0];
    let maxSub = nums[0];
    for (let i = 1; i < nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]);
        maxSub = Math.max(maxSub, current);
    }
    console.log(maxSub);
}

solve();
`
    },
    testcases: [
      { id: 1, name: 'Case 1', input: '9\n-2 1 -3 4 -1 2 1 -5 4', expected_output: '6' },
      { id: 2, name: 'Case 2', input: '1\n1', expected_output: '1' },
      { id: 3, name: 'Case 3', input: '5\n5 4 -1 7 8', expected_output: '23' }
    ]
  },
  {
    id: 'valid_parentheses',
    title: 'Valid Parentheses (Stack O(N))',
    difficulty: 'Easy',
    description: 'Verify matching parentheses using a lifo stack in O(N) time and O(N) space.',
    templates: {
      python: `import sys

def is_valid():
    s = sys.stdin.read().strip()
    if not s:
        print("true")
        return
    mapping = {')': '(', '}': '{', ']': '['}
    stack = []
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                print("false")
                return
        else:
            stack.append(char)
    print("true" if not stack else "false")

if __name__ == '__main__':
    is_valid()
`,
      cpp: `#include <iostream>
#include <string>
#include <stack>

using namespace std;

int main() {
    string s;
    if (!(cin >> s)) {
        cout << "true\\n";
        return 0;
    }
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else {
            if (st.empty()) { cout << "false\\n"; return 0; }
            char top = st.top(); st.pop();
            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) {
                cout << "false\\n";
                return 0;
            }
        }
    }
    cout << (st.empty() ? "true" : "false") << "\\n";
    return 0;
}
`
    },
    testcases: [
      { id: 1, name: 'Case 1', input: '()[]{}', expected_output: 'true' },
      { id: 2, name: 'Case 2', input: '(]', expected_output: 'false' },
      { id: 3, name: 'Case 3', input: '([{}])', expected_output: 'true' }
    ]
  }
]

export default function Compiler({ theme }) {
  const [languages, setLanguages] = useState([])
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('cf_cp_lang') || 'python')
  const [presets, setPresets] = useState(DEFAULT_PRESETS)
  const [selectedPresetId, setSelectedPresetId] = useState('custom')

  const [code, setCode] = useState(() => {
    return localStorage.getItem('cf_cp_code_python') || DEFAULT_TEMPLATES.python
  })

  const [activeTab, setActiveTab] = useState('testcases') // 'testcases' | 'stdin' | 'complexity'
  const [testcases, setTestcases] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_cp_testcases')
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS[0].testcases
    } catch {
      return DEFAULT_PRESETS[0].testcases
    }
  })
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0)

  // Stdin execution state
  const [customStdin, setCustomStdin] = useState('4 9\n2 7 11 15')
  const [singleOutput, setSingleOutput] = useState(null)

  // Testcase execution state
  const [batchResults, setBatchResults] = useState(null)

  // Complexity state
  const [complexity, setComplexity] = useState(null)
  const [analyzingComplexity, setAnalyzingComplexity] = useState(false)

  // Running state
  const [running, setRunning] = useState(false)
  const [runMessage, setRunMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const editorRef = useRef(null)

  // Fetch languages and presets from backend
  useEffect(() => {
    fetch('/api/compiler/languages/')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d && d.languages) setLanguages(d.languages)
        if (d && d.presets) setPresets(d.presets)
      })
      .catch(() => {})
  }, [])

  // Persist code per language
  useEffect(() => {
    localStorage.setItem(`cf_cp_code_${selectedLang}`, code)
  }, [code, selectedLang])

  // Persist testcases
  useEffect(() => {
    localStorage.setItem('cf_cp_testcases', JSON.stringify(testcases))
  }, [testcases])

  // Persist active language
  useEffect(() => {
    localStorage.setItem('cf_cp_lang', selectedLang)
  }, [selectedLang])

  const handleLanguageChange = newLang => {
    setSelectedLang(newLang)
    const saved = localStorage.getItem(`cf_cp_code_${newLang}`)
    if (saved) {
      setCode(saved)
    } else {
      // Find template in current preset or default
      const currPreset = presets.find(p => p.id === selectedPresetId)
      const tmpl = (currPreset?.templates && currPreset.templates[newLang]) || DEFAULT_TEMPLATES[newLang] || ''
      setCode(tmpl)
    }
  }

  const handlePresetChange = presetId => {
    setSelectedPresetId(presetId)
    const preset = presets.find(p => p.id === presetId)
    if (!preset) return

    // Load template for active language
    const tmpl = (preset.templates && preset.templates[selectedLang]) || DEFAULT_TEMPLATES[selectedLang] || ''
    setCode(tmpl)

    // Load preset testcases
    if (preset.testcases && preset.testcases.length > 0) {
      setTestcases(preset.testcases)
      setSelectedCaseIdx(0)
    }
    setBatchResults(null)
    setSingleOutput(null)
  }

  const resetTemplate = () => {
    const currPreset = presets.find(p => p.id === selectedPresetId)
    const tmpl = (currPreset?.templates && currPreset.templates[selectedLang]) || DEFAULT_TEMPLATES[selectedLang] || ''
    setCode(tmpl)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Add custom testcase
  const addTestCase = () => {
    const newId = Date.now()
    const newCase = {
      id: newId,
      name: `Case ${testcases.length + 1}`,
      input: '',
      expected_output: ''
    }
    const updated = [...testcases, newCase]
    setTestcases(updated)
    setSelectedCaseIdx(updated.length - 1)
  }

  // Remove testcase
  const removeTestCase = idxToRemove => {
    if (testcases.length <= 1) return
    const updated = testcases.filter((_, idx) => idx !== idxToRemove)
    setTestcases(updated)
    setSelectedCaseIdx(Math.max(0, idxToRemove - 1))
  }

  // Update current testcase
  const updateCurrentTestCase = (field, val) => {
    setTestcases(prev =>
      prev.map((tc, idx) => (idx === selectedCaseIdx ? { ...tc, [field]: val } : tc))
    )
  }

  // Execute all testcases
  const runAllTestcases = async () => {
    if (running || !code.trim()) return
    setRunning(true)
    setRunMessage('Compiling & Judging Testcases...')
    setActiveTab('testcases')

    try {
      const res = await fetch('/api/compiler/run/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: selectedLang,
          testcases
        })
      })
      const data = await res.json()
      setBatchResults(data)
    } catch (err) {
      setBatchResults({
        verdict: 'Execution Error',
        status: 'RUNTIME_ERROR',
        total_tests: testcases.length,
        passed_tests: 0,
        failed_tests: testcases.length,
        results: testcases.map(tc => ({
          ...tc,
          status: 'RUNTIME_ERROR',
          passed: false,
          error: err.message || 'Network error communicating with compiler backend.'
        }))
      })
    } finally {
      setRunning(false)
      setRunMessage('')
    }
  }

  // Execute single stdin run
  const runSingleInput = async () => {
    if (running || !code.trim()) return
    setRunning(true)
    setRunMessage('Executing...')
    setActiveTab('stdin')

    try {
      const res = await fetch('/api/compiler/run/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: selectedLang,
          stdin: customStdin
        })
      })
      const data = await res.json()
      setSingleOutput(data)
    } catch (err) {
      setSingleOutput({
        status: 'RUNTIME_ERROR',
        verdict: 'Execution Error',
        stdout: '',
        stderr: err.message || 'Failed to reach compiler backend.',
        time_ms: 0,
        memory_mb: 0
      })
    } finally {
      setRunning(false)
      setRunMessage('')
    }
  }

  // Analyze time and space complexity
  const analyzeComplexity = async () => {
    if (analyzingComplexity || !code.trim()) return
    setAnalyzingComplexity(true)
    setActiveTab('complexity')

    try {
      const res = await fetch('/api/compiler/complexity/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: selectedLang
        })
      })
      const data = await res.json()
      setComplexity(data)
    } catch (err) {
      setComplexity({
        time_complexity: 'Unknown',
        space_complexity: 'Unknown',
        best_case: 'Unknown',
        worst_case: 'Unknown',
        time_breakdown: 'Error communicating with complexity engine.',
        space_breakdown: err.message || 'Could not analyze complexity.',
        competitive_verdict: 'Analysis failed.',
        optimizations: [],
        source: 'Error'
      })
    } finally {
      setAnalyzingComplexity(false)
    }
  }

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (activeTab === 'stdin') {
          runSingleInput()
        } else {
          runAllTestcases()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [code, selectedLang, testcases, customStdin, activeTab])

  const currentCase = testcases[selectedCaseIdx] || testcases[0]
  const currentCaseResult = batchResults?.results?.find(r => r.id === currentCase?.id)

  const getVerdictBadge = verdict => {
    if (!verdict) return null
    if (verdict === 'Accepted' || verdict === 'Completed') {
      return { class: 'verdict-accepted', icon: CheckCircle2, text: verdict }
    }
    if (verdict.includes('Time Limit') || verdict === 'TLE') {
      return { class: 'verdict-tle', icon: Clock, text: 'Time Limit Exceeded' }
    }
    if (verdict.includes('Compilation')) {
      return { class: 'verdict-ce', icon: AlertTriangle, text: 'Compilation Error' }
    }
    return { class: 'verdict-wa', icon: XCircle, text: verdict }
  }

  const getCaseStatusIcon = tc => {
    if (!batchResults || !batchResults.results) return null
    const res = batchResults.results.find(r => r.id === tc.id)
    if (!res) return null
    if (res.passed) return <CheckCircle2 size={13} color="var(--ok)" />
    if (res.status === 'TIME_LIMIT_EXCEEDED' || res.status === 'TLE') return <Clock size={13} color="var(--high)" />
    return <XCircle size={13} color="var(--crit)" />
  }

  return (
    <div className="compiler-page">
      {/* Top Header Bar */}
      <header className="compiler-header">
        <div className="compiler-title-group">
          <div className="compiler-icon-wrap">
            <Terminal size={22} color="var(--accent)" />
          </div>
          <div>
            <div className="compiler-title-row">
              <h2>Competitive Programming Compiler</h2>
              <span className="badge-pill live">Multi-Language</span>
            </div>
            <p className="compiler-sub">
              Execute code with custom test cases, judge competitive programming solutions, and inspect asymptotic time & space complexity.
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="compiler-controls">
          <div className="control-item">
            <label>Problem Preset</label>
            <select
              className="select-input"
              value={selectedPresetId}
              onChange={e => handlePresetChange(e.target.value)}
            >
              {presets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.difficulty ? `(${p.difficulty})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="control-item">
            <label>Language</label>
            <select
              className="select-input"
              value={selectedLang}
              onChange={e => handleLanguageChange(e.target.value)}
            >
              <option value="python">Python 3 (CP Ready)</option>
              <option value="cpp">C++17 (G++ / Clang -O2)</option>
              <option value="c">C11 (GCC / Clang -O2)</option>
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="java">Java 17 (JDK)</option>
            </select>
          </div>

          <div className="compiler-action-btns">
            <button
              className="btn icon-btn"
              onClick={resetTemplate}
              title="Reset code to clean starter template"
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
            <button
              className="btn icon-btn"
              onClick={handleCopyCode}
              title="Copy code to clipboard"
            >
              {copied ? <Check size={15} color="var(--ok)" /> : <Copy size={15} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Monaco Editor on Left, Workstation on Right */}
      <div className="compiler-workspace">
        {/* Left Side: Monaco Code Editor */}
        <div className="compiler-editor-container">
          <div className="compiler-editor-bar">
            <div className="editor-lang-badge">
              <FileCode2 size={15} color="var(--accent)" />
              <span className="mono">
                {selectedLang === 'python' ? 'solution.py' : selectedLang === 'cpp' ? 'solution.cpp' : selectedLang === 'c' ? 'solution.c' : selectedLang === 'javascript' ? 'solution.js' : 'Main.java'}
              </span>
            </div>
            <div className="editor-shortcuts-hint">
              <span>Shortcuts:</span>
              <kbd className="kbd-shortcut">Cmd / Ctrl</kbd> + <kbd className="kbd-shortcut">Enter</kbd> to run
            </div>
          </div>

          <div className="compiler-monaco-wrapper">
            <Editor
              language={selectedLang === 'javascript' ? 'javascript' : selectedLang === 'cpp' || selectedLang === 'c' ? 'cpp' : selectedLang}
              value={code}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              onChange={val => setCode(val || '')}
              onMount={(editor) => { editorRef.current = editor }}
              options={{
                fontSize: 14,
                fontFamily: "'IBM Plex Mono', 'Fira Code', ui-monospace, monospace",
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 4,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 }
              }}
            />
          </div>

          {/* Editor Action Footer */}
          <div className="compiler-footer-bar">
            <button
              className="btn pri run-btn"
              onClick={runAllTestcases}
              disabled={running}
            >
              <Play size={16} fill="currentColor" />
              <span>{running ? runMessage || 'Running...' : 'Run All Test Cases'}</span>
            </button>

            <button
              className="btn sec"
              onClick={runSingleInput}
              disabled={running}
              title="Run with custom standard input (stdin)"
            >
              <Terminal size={15} />
              <span>Run Single Stdin</span>
            </button>

            <button
              className="btn sec complexity-btn"
              onClick={analyzeComplexity}
              disabled={analyzingComplexity}
              title="Estimate asymptotic Big-O Time & Space Complexity"
            >
              <Sparkles size={15} color="var(--purple)" />
              <span>{analyzingComplexity ? 'Analyzing...' : 'Analyze Complexity'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Interactive Panels (Testcases, Console Stdin, Complexity) */}
        <div className="compiler-results-container">
          {/* Navigation Tabs */}
          <div className="compiler-tabs">
            <button
              className={`compiler-tab ${activeTab === 'testcases' ? 'active' : ''}`}
              onClick={() => setActiveTab('testcases')}
            >
              <Layers size={15} />
              <span>Custom Test Cases</span>
              {testcases.length > 0 && <span className="tab-pill">{testcases.length}</span>}
            </button>

            <button
              className={`compiler-tab ${activeTab === 'stdin' ? 'active' : ''}`}
              onClick={() => setActiveTab('stdin')}
            >
              <Terminal size={15} />
              <span>Interactive Stdin</span>
            </button>

            <button
              className={`compiler-tab ${activeTab === 'complexity' ? 'active' : ''}`}
              onClick={() => setActiveTab('complexity')}
            >
              <Cpu size={15} />
              <span>Time & Space Complexity</span>
              {complexity && <span className="tab-pill glow">{complexity.time_complexity}</span>}
            </button>
          </div>

          {/* Tab 1: Custom Testcases (CP Arena Mode) */}
          {activeTab === 'testcases' && (
            <div className="tab-pane testcases-pane">
              {/* Testcases Tabs Header */}
              <div className="testcases-bar">
                <div className="testcase-chips">
                  {testcases.map((tc, idx) => (
                    <button
                      key={tc.id}
                      className={`testcase-chip ${selectedCaseIdx === idx ? 'active' : ''}`}
                      onClick={() => setSelectedCaseIdx(idx)}
                    >
                      {getCaseStatusIcon(tc)}
                      <span>{tc.name || `Case ${idx + 1}`}</span>
                    </button>
                  ))}
                  <button className="add-testcase-btn" onClick={addTestCase} title="Add custom test case">
                    <Plus size={14} />
                    <span>Add Case</span>
                  </button>
                </div>

                {testcases.length > 1 && (
                  <button
                    className="delete-case-btn"
                    onClick={() => removeTestCase(selectedCaseIdx)}
                    title="Remove this testcase"
                  >
                    <Trash2 size={14} />
                    <span>Delete Case</span>
                  </button>
                )}
              </div>

              {/* Input / Expected Output Edit Area */}
              <div className="testcase-inputs-grid">
                <div className="testcase-field">
                  <div className="field-label">
                    <span>Input (stdin)</span>
                    <span className="mono-tag">stdin</span>
                  </div>
                  <textarea
                    className="code-textarea"
                    placeholder="Enter input data passed to program..."
                    value={currentCase?.input || ''}
                    onChange={e => updateCurrentTestCase('input', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="testcase-field">
                  <div className="field-label">
                    <span>Expected Output (stdout)</span>
                    <span className="mono-tag optional">optional judge</span>
                  </div>
                  <textarea
                    className="code-textarea"
                    placeholder="Enter expected stdout for verification..."
                    value={currentCase?.expected_output || ''}
                    onChange={e => updateCurrentTestCase('expected_output', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {/* Execution Results Summary & Details */}
              <div className="testcase-results-section">
                {batchResults ? (
                  <div className="results-wrapper">
                    {/* Overall Verdict Banner */}
                    <div className={`verdict-banner ${batchResults.status === 'PASSED' ? 'passed' : 'failed'}`}>
                      <div className="verdict-main">
                        {batchResults.status === 'PASSED' ? (
                          <CheckCircle2 size={24} className="verdict-icon pass" />
                        ) : (
                          <XCircle size={24} className="verdict-icon fail" />
                        )}
                        <div>
                          <div className="verdict-title">{batchResults.verdict}</div>
                          <div className="verdict-stats">
                            {batchResults.passed_tests} / {batchResults.total_tests} test cases passed
                          </div>
                        </div>
                      </div>

                      <div className="verdict-metrics">
                        <div className="metric-chip">
                          <Timer size={14} />
                          <span>{batchResults.total_time_ms} ms</span>
                        </div>
                        <div className="metric-chip">
                          <Cpu size={14} />
                          <span>{batchResults.max_memory_mb} MB</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Test Case Execution Result */}
                    {currentCaseResult && (
                      <div className="case-detail-card">
                        <div className="case-detail-header">
                          <div className="case-status-indicator">
                            {currentCaseResult.passed ? (
                              <span className="status-badge pass">
                                <CheckCircle2 size={13} /> Passed
                              </span>
                            ) : currentCaseResult.status === 'TIME_LIMIT_EXCEEDED' ? (
                              <span className="status-badge tle">
                                <Clock size={13} /> Time Limit Exceeded
                              </span>
                            ) : currentCaseResult.status === 'COMPILATION_ERROR' ? (
                              <span className="status-badge error">
                                <AlertTriangle size={13} /> Compilation Error
                              </span>
                            ) : (
                              <span className="status-badge fail">
                                <XCircle size={13} /> Wrong Answer
                              </span>
                            )}
                            <span className="case-runtime">
                              {currentCaseResult.time_ms} ms · {currentCaseResult.memory_mb} MB
                            </span>
                          </div>
                        </div>

                        {/* Actual vs Expected comparison */}
                        <div className="output-comparison-grid">
                          <div className="output-box">
                            <div className="output-box-label">Your Output:</div>
                            <pre className="output-content">
                              {currentCaseResult.actual_output || '(no stdout produced)'}
                            </pre>
                          </div>

                          {currentCase?.expected_output && (
                            <div className="output-box">
                              <div className="output-box-label">Expected Output:</div>
                              <pre className="output-content">
                                {currentCase.expected_output}
                              </pre>
                            </div>
                          )}
                        </div>

                        {currentCaseResult.stderr && (
                          <div className="stderr-box">
                            <div className="output-box-label error">Stderr / Diagnostics:</div>
                            <pre className="output-content error">{currentCaseResult.stderr}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-results-prompt">
                    <Play size={28} color="var(--text-dim)" />
                    <p>Click &quot;Run All Test Cases&quot; to test your code against all inputs.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Standard Console / Stdin */}
          {activeTab === 'stdin' && (
            <div className="tab-pane stdin-pane">
              <div className="stdin-input-box">
                <div className="field-label">
                  <span>Custom Standard Input (stdin)</span>
                  <button className="run-small-btn" onClick={runSingleInput} disabled={running}>
                    <Play size={13} fill="currentColor" />
                    <span>Run</span>
                  </button>
                </div>
                <textarea
                  className="code-textarea"
                  value={customStdin}
                  onChange={e => setCustomStdin(e.target.value)}
                  placeholder="Provide standard input lines here..."
                  rows={4}
                />
              </div>

              <div className="terminal-display">
                <div className="terminal-bar">
                  <div className="terminal-title">
                    <Terminal size={14} />
                    <span>Program Output (stdout)</span>
                  </div>
                  {singleOutput && (
                    <div className="terminal-meta">
                      <span className="meta-tag">{singleOutput.time_ms} ms</span>
                      <span className="meta-tag">{singleOutput.memory_mb} MB</span>
                    </div>
                  )}
                </div>

                <div className="terminal-body">
                  {singleOutput ? (
                    <>
                      {singleOutput.stdout ? (
                        <pre className="terminal-text">{singleOutput.stdout}</pre>
                      ) : (
                        <p className="terminal-muted">Program finished with no output to stdout.</p>
                      )}

                      {singleOutput.stderr && (
                        <div className="terminal-stderr">
                          <span className="stderr-title">Error trace:</span>
                          <pre>{singleOutput.stderr}</pre>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="terminal-muted">Click &quot;Run Single Stdin&quot; or press Cmd+Enter to execute.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Time & Space Complexity */}
          {activeTab === 'complexity' && (
            <div className="tab-pane complexity-pane">
              <div className="complexity-actions-bar">
                <div className="complexity-headline">
                  <h4>Asymptotic Complexity Engine</h4>
                  <p>Evaluates Big-O time and space complexity with competitive programming constraints.</p>
                </div>
                <button
                  className="btn pri reanalyze-btn"
                  onClick={analyzeComplexity}
                  disabled={analyzingComplexity}
                >
                  <Sparkles size={14} />
                  <span>{analyzingComplexity ? 'Calculating...' : 'Calculate Complexity'}</span>
                </button>
              </div>

              {complexity ? (
                <div className="complexity-results-grid">
                  {/* Top Big-O Metric Cards */}
                  <div className="complexity-cards-row">
                    <div className="bigo-card time">
                      <div className="bigo-card-header">
                        <Timer size={18} color="var(--cyan)" />
                        <span>Time Complexity</span>
                      </div>
                      <div className="bigo-badge time">{complexity.time_complexity}</div>
                      <div className="bigo-sub-stats">
                        <span>Best: {complexity.best_case || 'O(1)'}</span>
                        <span>Worst: {complexity.worst_case || complexity.time_complexity}</span>
                      </div>
                    </div>

                    <div className="bigo-card space">
                      <div className="bigo-card-header">
                        <Layers size={18} color="var(--purple)" />
                        <span>Space Complexity</span>
                      </div>
                      <div className="bigo-badge space">{complexity.space_complexity}</div>
                      <div className="bigo-sub-stats">
                        <span>Auxiliary space & call stack</span>
                      </div>
                    </div>
                  </div>

                  {/* Competitive Programming Verdict Card */}
                  <div className="cp-verdict-card">
                    <div className="cp-verdict-header">
                      <Zap size={16} color="var(--accent)" />
                      <span>Competitive Programming Verdict</span>
                    </div>
                    <p className="cp-verdict-body">{complexity.competitive_verdict}</p>
                  </div>

                  {/* Deep Breakdown Sections */}
                  <div className="complexity-breakdown-card">
                    <h5>Time Complexity Analysis</h5>
                    <p>{complexity.time_breakdown}</p>

                    <h5>Space & Memory Breakdown</h5>
                    <p>{complexity.space_breakdown}</p>

                    {complexity.optimizations && complexity.optimizations.length > 0 && (
                      <div className="optimizations-box">
                        <h5>Competitive Programming Optimizations</h5>
                        <ul>
                          {complexity.optimizations.map((tip, idx) => (
                            <li key={idx}>
                              <ChevronRight size={13} color="var(--accent)" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="complexity-source-tag">
                      <Info size={12} />
                      <span>Analyzed via {complexity.source || 'CodeForge Static AST Engine'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-results-prompt">
                  <Sparkles size={32} color="var(--purple)" />
                  <p>Click &quot;Calculate Complexity&quot; to inspect Big-O Time & Space complexities.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

