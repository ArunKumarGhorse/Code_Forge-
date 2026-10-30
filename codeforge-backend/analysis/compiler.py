import ast
import os
import re
import resource
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Any, Dict, List, Optional

# Supported languages configuration
SUPPORTED_LANGUAGES = {
    "python": {
        "id": "python",
        "name": "Python 3",
        "version": "3.9+",
        "extension": ".py",
        "monaco": "python",
        "is_compiled": False,
        "available": True,
    },
    "cpp": {
        "id": "cpp",
        "name": "C++ (C++17)",
        "version": "Clang / G++ C++17",
        "extension": ".cpp",
        "monaco": "cpp",
        "is_compiled": True,
        "available": bool(shutil.which("g++") or shutil.which("clang++")),
    },
    "c": {
        "id": "c",
        "name": "C (C11)",
        "version": "Clang / GCC C11",
        "extension": ".c",
        "monaco": "c",
        "is_compiled": True,
        "available": bool(shutil.which("gcc") or shutil.which("clang")),
    },
    "javascript": {
        "id": "javascript",
        "name": "JavaScript (Node.js)",
        "version": "Node.js v20+",
        "extension": ".js",
        "monaco": "javascript",
        "is_compiled": False,
        "available": bool(shutil.which("node")),
    },
    "java": {
        "id": "java",
        "name": "Java",
        "version": "Java 17+",
        "extension": ".java",
        "monaco": "java",
        "is_compiled": True,
        "available": bool(shutil.which("javac")),
    },
}

CODE_TEMPLATES = {
    "python": '''import sys

def solve():
    """
    Competitive Programming Starter Template (Python 3)
    Fast I/O and standard input parsing
    """
    input_data = sys.stdin.read().split()
    if not input_data:
        print("CodeForge Compiler Ready")
        return
    
    # Example reading:
    # n = int(input_data[0])
    # nums = [int(x) for x in input_data[1:]]
    print(f"Read {len(input_data)} tokens")

if __name__ == '__main__':
    solve()
''',
    "cpp": '''#include <iostream>
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
        for (int i = 0; i < n; i++) {
            cin >> nums[i];
        }
        cout << "Successfully read " << n << " elements\\n";
    } else {
        cout << "CodeForge C++ Compiler Ready\\n";
    }

    return 0;
}
''',
    "c": '''#include <stdio.h>
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
''',
    "javascript": '''const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) {
        console.log("CodeForge JS Compiler Ready");
        return;
    }
    const tokens = input.split(/\\s+/);
    console.log(`Read ${tokens.length} tokens`);
}

solve();
''',
    "java": '''import java.util.Scanner;

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
'''
}

PROBLEM_PRESETS = [
    {
        "id": "two_sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        "input_format": "Line 1: N target\\nLine 2: N space-separated integers",
        "templates": {
            "python": '''import sys

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
''',
            "cpp": '''#include <iostream>
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
''',
            "c": '''#include <stdio.h>
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
''',
            "javascript": '''const fs = require('fs');

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
            console.log(`${seen.get(comp)} ${i}`);
            return;
        }
        seen.set(nums[i], i);
    }
    console.log("-1 -1");
}

solve();
'''
        },
        "testcases": [
            {
                "id": 1,
                "name": "Case 1",
                "input": "4 9\\n2 7 11 15",
                "expected_output": "0 1"
            },
            {
                "id": 2,
                "name": "Case 2",
                "input": "3 6\\n3 2 4",
                "expected_output": "1 2"
            },
            {
                "id": 3,
                "name": "Case 3",
                "input": "2 6\\n3 3",
                "expected_output": "0 1"
            }
        ]
    },
    {
        "id": "max_subarray",
        "title": "Maximum Subarray (Kadane's Algorithm)",
        "difficulty": "Medium",
        "description": "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
        "input_format": "Line 1: N\\nLine 2: N space-separated integers",
        "templates": {
            "python": '''import sys

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
''',
            "cpp": '''#include <iostream>
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
''',
            "javascript": '''const fs = require('fs');

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
'''
        },
        "testcases": [
            {
                "id": 1,
                "name": "Case 1",
                "input": "9\\n-2 1 -3 4 -1 2 1 -5 4",
                "expected_output": "6"
            },
            {
                "id": 2,
                "name": "Case 2",
                "input": "1\\n1",
                "expected_output": "1"
            },
            {
                "id": 3,
                "name": "Case 3",
                "input": "5\\n5 4 -1 7 8",
                "expected_output": "23"
            }
        ]
    },
    {
        "id": "valid_parentheses",
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "description": "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
        "input_format": "Single string of bracket characters",
        "templates": {
            "python": '''import sys

def is_valid():
    s = sys.stdin.read().strip()
    if not s:
        print("true")
        return
    mapping = {')': '(', '}': '{', ']': '['}
    stack = []
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                print("false")
                return
        else:
            stack.append(char)
    print("true" if not stack else "false")

if __name__ == '__main__':
    is_valid()
''',
            "cpp": '''#include <iostream>
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
'''
        },
        "testcases": [
            {
                "id": 1,
                "name": "Case 1",
                "input": "()[]{}",
                "expected_output": "true"
            },
            {
                "id": 2,
                "name": "Case 2",
                "input": "(]",
                "expected_output": "false"
            },
            {
                "id": 3,
                "name": "Case 3",
                "input": "([{}])",
                "expected_output": "true"
            }
        ]
    }
]


def _get_max_rss_mb(rss_raw: int) -> float:
    """Calculates peak memory usage in MB based on platform conventions."""
    if sys.platform == "darwin":
        # On macOS ru_maxrss is in bytes
        return round(rss_raw / (1024 * 1024), 2)
    else:
        # On Linux ru_maxrss is in kilobytes
        return round(rss_raw / 1024, 2)


def compile_program(workdir: str, language: str, source_file: str) -> Dict[str, Any]:
    """Compiles source code if required by the language."""
    cfg = SUPPORTED_LANGUAGES.get(language)
    if not cfg:
        return {"success": False, "error": f"Unsupported language '{language}'"}

    if not cfg["is_compiled"]:
        return {"success": True, "executable": source_file}

    if language == "cpp":
        exe_file = os.path.join(workdir, "program")
        compiler = shutil.which("g++") or shutil.which("clang++")
        if not compiler:
            return {"success": False, "error": "No C++ compiler (g++ or clang++) found on system."}
        cmd = [compiler, "-O2", "-std=c++17", "-Wall", source_file, "-o", exe_file]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=workdir)
        if res.returncode != 0:
            return {
                "success": False,
                "error": res.stderr or "Compilation failed without output.",
                "status": "COMPILATION_ERROR"
            }
        return {"success": True, "executable": exe_file}

    elif language == "c":
        exe_file = os.path.join(workdir, "program")
        compiler = shutil.which("gcc") or shutil.which("clang")
        if not compiler:
            return {"success": False, "error": "No C compiler (gcc or clang) found on system."}
        cmd = [compiler, "-O2", "-std=c11", "-Wall", source_file, "-o", exe_file]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=workdir)
        if res.returncode != 0:
            return {
                "success": False,
                "error": res.stderr or "Compilation failed without output.",
                "status": "COMPILATION_ERROR"
            }
        return {"success": True, "executable": exe_file}

    elif language == "java":
        javac = shutil.which("javac")
        if not javac:
            return {"success": False, "error": "JDK javac compiler not found on system. Please select Python, C++, C, or JavaScript."}
        res = subprocess.run([javac, source_file], capture_output=True, text=True, cwd=workdir)
        if res.returncode != 0:
            return {
                "success": False,
                "error": res.stderr or "Java compilation failed.",
                "status": "COMPILATION_ERROR"
            }
        # Java class name without .java
        class_name = os.path.splitext(os.path.basename(source_file))[0]
        return {"success": True, "executable": class_name, "is_java": True}

    return {"success": True, "executable": source_file}


def execute_binary(
    workdir: str,
    language: str,
    executable: str,
    stdin_data: str = "",
    timeout: float = 3.0,
    is_java: bool = False
) -> Dict[str, Any]:
    """Runs a prepared binary/script against stdin with timeout and resource tracking."""
    if is_java or language == "java":
        java_bin = shutil.which("java") or "java"
        cmd = [java_bin, "-cp", workdir, executable]
    elif language == "python":
        cmd = [sys.executable, "-u", executable]
    elif language == "javascript":
        node_bin = shutil.which("node") or "node"
        cmd = [node_bin, executable]
    else:
        # C or C++ binary
        cmd = [executable]

    start_rss = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
    start_time = time.perf_counter()

    try:
        proc = subprocess.run(
            cmd,
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=workdir
        )
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        end_rss = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
        mem_mb = _get_max_rss_mb(end_rss if end_rss > 0 else (start_rss or 1024 * 1024 * 4))

        stdout = proc.stdout
        stderr = proc.stderr

        # Truncate if gigantic
        if len(stdout) > 50000:
            stdout = stdout[:50000] + "\n... [Output truncated to 50KB]"
        if len(stderr) > 20000:
            stderr = stderr[:20000] + "\n... [Stderr truncated]"

        if proc.returncode != 0:
            return {
                "status": "RUNTIME_ERROR",
                "returncode": proc.returncode,
                "stdout": stdout,
                "stderr": stderr,
                "time_ms": elapsed_ms,
                "memory_mb": max(mem_mb, 1.2),
            }

        return {
            "status": "SUCCESS",
            "returncode": 0,
            "stdout": stdout,
            "stderr": stderr,
            "time_ms": elapsed_ms,
            "memory_mb": max(mem_mb, 1.2),
        }

    except subprocess.TimeoutExpired:
        elapsed_ms = round(timeout * 1000, 2)
        return {
            "status": "TLE",
            "returncode": -1,
            "stdout": "",
            "stderr": f"Time Limit Exceeded: Execution surpassed timeout of {timeout}s.",
            "time_ms": elapsed_ms,
            "memory_mb": 0.0,
        }
    except Exception as e:
        return {
            "status": "RUNTIME_ERROR",
            "returncode": -1,
            "stdout": "",
            "stderr": str(e),
            "time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "memory_mb": 0.0,
        }


def run_code(
    code: str,
    language: str = "python",
    stdin: str = "",
    testcases: Optional[List[Dict[str, Any]]] = None,
    timeout: float = 3.0
) -> Dict[str, Any]:
    """
    Main entry point for compiler execution.
    Supports either single interactive stdin run or batch CP testcases judging.
    """
    cfg = SUPPORTED_LANGUAGES.get(language)
    if not cfg:
        return {"error": f"Language '{language}' is not supported."}

    with tempfile.TemporaryDirectory() as workdir:
        # Determine source filename
        filename = "Main" + cfg["extension"]
        if language == "java":
            # Extract public class name if available
            m = re.search(r"public\s+class\s+([A-Za-z0-9_]+)", code)
            if m:
                filename = f"{m.group(1)}.java"

        source_path = os.path.join(workdir, filename)
        with open(source_path, "w", encoding="utf-8") as f:
            f.write(code)

        # 1. Compile program if compiled language
        comp = compile_program(workdir, language, source_path)
        if not comp["success"]:
            return {
                "verdict": "Compilation Error",
                "status": "COMPILATION_ERROR",
                "compile_error": comp["error"],
                "stdout": "",
                "stderr": comp["error"],
                "time_ms": 0.0,
                "memory_mb": 0.0,
                "total_tests": len(testcases) if testcases else 0,
                "passed_tests": 0,
                "failed_tests": len(testcases) if testcases else 0,
                "results": [
                    {
                        "id": tc.get("id", idx + 1),
                        "status": "COMPILATION_ERROR",
                        "passed": False,
                        "error": comp["error"]
                    }
                    for idx, tc in enumerate(testcases or [])
                ] if testcases else []
            }

        executable = comp["executable"]
        is_java = comp.get("is_java", False)

        # 2. If testcases are provided, run each testcase
        if testcases and len(testcases) > 0:
            results = []
            passed_count = 0
            total_time_ms = 0.0
            max_memory_mb = 0.0
            first_fail_status = None

            for idx, tc in enumerate(testcases):
                tc_id = tc.get("id", idx + 1)
                tc_name = tc.get("name", f"Case {idx + 1}")
                tc_in = tc.get("input", "")
                tc_expected = tc.get("expected_output", "")

                exec_res = execute_binary(workdir, language, executable, tc_in, timeout=timeout, is_java=is_java)
                status = exec_res["status"]
                actual = exec_res["stdout"].strip()
                expected = tc_expected.strip() if tc_expected is not None else ""

                passed = False
                if status == "SUCCESS":
                    if tc_expected is None or tc_expected == "":
                        # No expected output provided, considered executed successfully
                        passed = True
                        status = "PASSED"
                    elif actual == expected:
                        passed = True
                        status = "PASSED"
                    else:
                        status = "WRONG_ANSWER"
                elif status == "TLE":
                    status = "TIME_LIMIT_EXCEEDED"

                if passed:
                    passed_count += 1
                elif not first_fail_status:
                    first_fail_status = status

                total_time_ms += exec_res.get("time_ms", 0.0)
                max_memory_mb = max(max_memory_mb, exec_res.get("memory_mb", 0.0))

                results.append({
                    "id": tc_id,
                    "name": tc_name,
                    "input": tc_in,
                    "expected_output": tc_expected,
                    "actual_output": exec_res["stdout"],
                    "stderr": exec_res["stderr"],
                    "status": status,
                    "passed": passed,
                    "time_ms": exec_res.get("time_ms", 0.0),
                    "memory_mb": exec_res.get("memory_mb", 0.0),
                })

            # Determine overall verdict
            if passed_count == len(testcases):
                verdict = "Accepted"
            elif first_fail_status == "TIME_LIMIT_EXCEEDED":
                verdict = "Time Limit Exceeded"
            elif first_fail_status == "RUNTIME_ERROR":
                verdict = "Runtime Error"
            else:
                verdict = "Wrong Answer"

            return {
                "verdict": verdict,
                "status": "PASSED" if verdict == "Accepted" else "FAILED",
                "total_tests": len(testcases),
                "passed_tests": passed_count,
                "failed_tests": len(testcases) - passed_count,
                "total_time_ms": round(total_time_ms, 2),
                "max_memory_mb": round(max_memory_mb, 2),
                "results": results
            }

        # 3. Single execution mode (standard stdin)
        res = execute_binary(workdir, language, executable, stdin, timeout=timeout, is_java=is_java)
        return {
            "verdict": "Completed" if res["status"] == "SUCCESS" else res["status"].replace("_", " ").title(),
            "status": res["status"],
            "stdout": res["stdout"],
            "stderr": res["stderr"],
            "time_ms": res["time_ms"],
            "memory_mb": res["memory_mb"],
        }


# =========================================================================
# ASYMPTOTIC TIME AND SPACE COMPLEXITY ANALYZER
# =========================================================================

class PythonComplexityVisitor(ast.NodeVisitor):
    """Parses Python AST to extract loop nesting, recursion, data structures & complexity factors."""
    def __init__(self):
        self.max_loop_depth = 0
        self.current_loop_depth = 0
        self.current_fn = None
        self.function_defs = set()
        self.recursive_calls = {}
        self.has_sorting = False
        self.has_log_division = False
        self.has_matrix = False
        self.data_structures = set()

    def visit_FunctionDef(self, node):
        self.function_defs.add(node.name)
        old_fn = self.current_fn
        self.current_fn = node.name
        self.recursive_calls[node.name] = 0
        self.generic_visit(node)
        self.current_fn = old_fn

    def visit_For(self, node):
        self.current_loop_depth += 1
        if self.current_loop_depth > self.max_loop_depth:
            self.max_loop_depth = self.current_loop_depth
        self.generic_visit(node)
        self.current_loop_depth -= 1

    def visit_While(self, node):
        self.current_loop_depth += 1
        if self.current_loop_depth > self.max_loop_depth:
            self.max_loop_depth = self.current_loop_depth
        self.generic_visit(node)
        self.current_loop_depth -= 1

    def visit_Call(self, node):
        # Recursive call check
        if self.current_fn:
            if isinstance(node.func, ast.Name) and node.func.id == self.current_fn:
                self.recursive_calls[self.current_fn] = self.recursive_calls.get(self.current_fn, 0) + 1
            elif isinstance(node.func, ast.Attribute) and node.func.attr == self.current_fn:
                self.recursive_calls[self.current_fn] = self.recursive_calls.get(self.current_fn, 0) + 1

        # Sorting detection
        if isinstance(node.func, ast.Name) and node.func.id in ("sorted",):
            self.has_sorting = True
        elif isinstance(node.func, ast.Attribute) and node.func.attr in ("sort",):
            self.has_sorting = True

        # Data structure constructors
        if isinstance(node.func, ast.Name):
            if node.func.id in ("set", "dict", "list", "defaultdict", "Counter", "deque", "heapq"):
                self.data_structures.add(node.func.id)

        self.generic_visit(node)

    def visit_Dict(self, node):
        self.data_structures.add("dict")
        self.generic_visit(node)

    def visit_Set(self, node):
        self.data_structures.add("set")
        self.generic_visit(node)

    def visit_List(self, node):
        if len(node.elts) > 0 and any(isinstance(e, ast.List) for e in node.elts):
            self.has_matrix = True
        self.generic_visit(node)


def analyze_static_complexity(code: str, language: str) -> Dict[str, Any]:
    """
    Fast, reliable static complexity estimator using AST and syntactic heuristics.
    Guarantees instantaneous response even if offline or AI API is unreachable.
    """
    max_loop_depth = 0
    has_recursion = False
    max_recursive_branches = 0
    has_sort = False
    has_hash_or_heap = False
    has_matrix = False

    if language == "python":
        try:
            tree = ast.parse(code)
            visitor = PythonComplexityVisitor()
            visitor.visit(tree)
            max_loop_depth = visitor.max_loop_depth
            has_sort = visitor.has_sorting
            has_matrix = visitor.has_matrix
            if visitor.recursive_calls:
                max_recursive_branches = max(visitor.recursive_calls.values())
                has_recursion = max_recursive_branches > 0
            if any(ds in visitor.data_structures for ds in ("dict", "set", "defaultdict", "Counter", "heapq", "deque")):
                has_hash_or_heap = True
        except Exception:
            # Fallback to lexical analysis if snippet has syntax error
            pass

    if max_loop_depth == 0 and not has_recursion:
        # Lexical pattern matching for C++, C, Java, JS and fallback Python
        for_count = len(re.findall(r"\bfor\b", code))
        while_count = len(re.findall(r"\bwhile\b", code))

        # Check for nested loops roughly via indentation / brace nesting
        lines = code.splitlines()
        current_nesting = 0
        peak_nesting = 0
        for line in lines:
            if re.search(r"\b(for|while)\b", line):
                current_nesting += 1
                peak_nesting = max(peak_nesting, current_nesting)
            if "}" in line or (language == "python" and line.strip() and not line.startswith(" ")):
                if current_nesting > 0:
                    current_nesting = max(0, current_nesting - 1)
        max_loop_depth = max(peak_nesting, 1 if (for_count > 0 or while_count > 0) else 0)

        # Check sort
        if re.search(r"(\.sort\(|std::sort|Arrays\.sort|qsort|sorted\()", code):
            has_sort = True

        # Check recursion
        fn_names = re.findall(r"(?:def|function|void|int|bool|long|double|auto)\s+([A-Za-z0-9_]+)\s*\(", code)
        for fn in fn_names:
            if fn in ("main", "solve"):
                continue
            calls = len(re.findall(rf"\b{fn}\s*\(", code))
            if calls > 1:
                has_recursion = True
                max_recursive_branches = max(max_recursive_branches, calls - 1)

        # Check data structures
        if re.search(r"(unordered_map|map|unordered_set|set|HashMap|HashSet|new Map|new Set|dict|vector<vector)", code):
            has_hash_or_heap = True
        if re.search(r"(\[.*\]\[.*\]|vector<vector)", code):
            has_matrix = True

    # 1. Determine Time Complexity
    time_complexity = "O(1)"
    best_case = "O(1)"
    worst_case = "O(1)"
    time_breakdown = "Constant time operations with no scalable iterative loops or recursion."

    if has_recursion and max_recursive_branches >= 2:
        time_complexity = "O(2^N)"
        worst_case = "O(2^N)"
        best_case = "O(1)"
        time_breakdown = f"Exponential branching recursion detected with {max_recursive_branches} recursive branches per state."
    elif has_sort and max_loop_depth <= 1:
        time_complexity = "O(N log N)"
        worst_case = "O(N log N)"
        best_case = "O(N)"
        time_breakdown = "Dominated by sorting algorithm (O(N log N)) combined with linear element iteration."
    elif max_loop_depth == 3:
        time_complexity = "O(N^3)"
        worst_case = "O(N^3)"
        best_case = "O(1)"
        time_breakdown = "Triple nested loops iterate over problem space, yielding cubic time complexity."
    elif max_loop_depth == 2:
        time_complexity = "O(N^2)"
        worst_case = "O(N^2)"
        best_case = "O(N)" if "break" in code else "O(N^2)"
        time_breakdown = "Two nested loops iterate over the input collection, yielding quadratic time complexity."
    elif max_loop_depth == 1:
        time_complexity = "O(N)"
        worst_case = "O(N)"
        best_case = "O(1)" if "break" in code or "return" in code else "O(N)"
        time_breakdown = "Single linear pass through the input dataset with constant time inner operations."
    elif has_recursion and max_recursive_branches == 1:
        time_complexity = "O(N)"
        worst_case = "O(N)"
        best_case = "O(1)"
        time_breakdown = "Linear recursive descent across input parameters."

    # 2. Determine Space Complexity
    space_complexity = "O(1)"
    space_breakdown = "Constant auxiliary space O(1); operates in-place with fixed primitive scalar variables."

    if has_matrix:
        space_complexity = "O(N^2)"
        space_breakdown = "Quadratic space O(N^2) allocated for 2D matrix / tabular dynamic programming state."
    elif has_hash_or_heap or (language == "python" and "seen" in code):
        space_complexity = "O(N)"
        space_breakdown = "Linear auxiliary space O(N) allocated for hash map, set, or buffer structures."
    elif has_recursion:
        space_complexity = "O(N)"
        space_breakdown = "Linear auxiliary space O(N) incurred by recursive call stack frames."

    # 3. Competitive Programming Constraints Verdict
    if time_complexity in ("O(1)", "O(log N)"):
        verdict = "Optimal for CP. Executes instantaneously in < 1 ms. Can handle arbitrarily large inputs."
    elif time_complexity in ("O(N)", "O(N log N)"):
        verdict = "Optimal for CP. Safely passes typical 1.0s contest limits for N ≤ 10^5 to 10^6 elements."
    elif time_complexity == "O(N^2)":
        verdict = "Acceptable for N ≤ 5,000. Will likely trigger Time Limit Exceeded (TLE) if N exceeds 10^4."
    elif time_complexity == "O(N^3)":
        verdict = "Feasible only for small constraints (N ≤ 400). High risk of TLE for standard CP problem sets."
    else:
        verdict = "Exponential complexity. Feasible only for tiny constraints (N ≤ 25). Consider DP or memoization."

    optimizations = []
    if time_complexity == "O(N^2)":
        optimizations.append("Consider replacing the inner loop with a Hash Map (O(N) time) or Two-Pointer technique if sorted.")
    if time_complexity in ("O(2^N)", "O(N!)"):
        optimizations.append("Apply Memoization (Top-down DP) or Tabulation (Bottom-up DP) to eliminate overlapping subproblems.")
    if language == "cpp":
        optimizations.append("Ensure fast I/O is active: `ios_base::sync_with_stdio(false); cin.tie(NULL);`.")
    elif language == "python":
        optimizations.append("Use `sys.stdin.read().split()` for fast bulk input parsing in competitive programming.")

    if not optimizations:
        optimizations.append("Current time and space complexity profile is optimal for competitive programming.")

    return {
        "time_complexity": time_complexity,
        "space_complexity": space_complexity,
        "best_case": best_case,
        "worst_case": worst_case,
        "time_breakdown": time_breakdown,
        "space_breakdown": space_breakdown,
        "competitive_verdict": verdict,
        "optimizations": optimizations,
        "source": "Static CodeForge Analyzer",
    }


def analyze_complexity_with_ai(code: str, language: str) -> Optional[Dict[str, Any]]:
    """Attempts AI-powered complexity analysis with Google Gemini if configured."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    import json
    import urllib.request

    prompt = (
        f"You are a World-Class Competitive Programming Coach and Complexity Expert.\n"
        f"Analyze the time and space complexity of the following {language} code:\n\n"
        f"```{language}\n{code}\n```\n\n"
        f"REQUIREMENTS:\n"
        f"1. Determine the Big-O Time Complexity (e.g. O(1), O(log N), O(N), O(N log N), O(N^2), O(2^N)).\n"
        f"2. Determine the Big-O Auxiliary Space Complexity (e.g. O(1), O(N), O(N^2)).\n"
        f"3. Provide Best-case and Worst-case time complexity.\n"
        f"4. Provide a clear, non-jargon Time Breakdown explaining loops, operations, or recursion.\n"
        f"5. Provide a clear Space Breakdown explaining auxiliary memory, data structures, and call stack.\n"
        f"6. Provide a Competitive Programming Verdict (Can it pass 1.0s limit for N=10^5?).\n"
        f"7. Provide 1 to 3 specific optimization tips.\n\n"
        f"You must respond in valid JSON matching this schema:\n"
        f"{{\n"
        f'  "time_complexity": "string",\n'
        f'  "space_complexity": "string",\n'
        f'  "best_case": "string",\n'
        f'  "worst_case": "string",\n'
        f'  "time_breakdown": "string",\n'
        f'  "space_breakdown": "string",\n'
        f'  "competitive_verdict": "string",\n'
        f'  "optimizations": ["string"]\n'
        f"}}"
    )

    models = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-pro-latest"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }
    body_bytes = json.dumps(payload).encode("utf-8")

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            req = urllib.request.Request(
                url,
                data=body_bytes,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                candidates = resp_data.get("candidates", [])
                if candidates:
                    raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    clean_text = raw_text.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    elif clean_text.startswith("```"):
                        clean_text = clean_text[3:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    parsed = json.loads(clean_text.strip())
                    parsed["source"] = f"Gemini AI ({model})"
                    return parsed
        except Exception:
            continue

    return None


def get_complexity_analysis(code: str, language: str = "python") -> Dict[str, Any]:
    """Unified complexity analyzer: tries AI first, seamlessly falls back to static AST analyzer."""
    if not code or not code.strip():
        return {
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "best_case": "O(1)",
            "worst_case": "O(1)",
            "time_breakdown": "Empty code snippet provided.",
            "space_breakdown": "No memory allocated.",
            "competitive_verdict": "No execution required.",
            "optimizations": [],
            "source": "Static Analyzer",
        }

    # Try AI analysis
    ai_result = analyze_complexity_with_ai(code, language)
    if ai_result:
        return ai_result

    # Reliable static fallback
    return analyze_static_complexity(code, language)
