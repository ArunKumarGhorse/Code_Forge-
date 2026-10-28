import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Hammer,
  ShieldCheck,
  Zap,
  Cpu,
  Lock,
  History,
  CheckCircle2,
  ArrowRight,
  Code2,
  Terminal,
  Layers,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  Flame,
  ShieldAlert,
  Play,
  Check,
  FileCode2
} from 'lucide-react'

const CODE_EXAMPLES = {
  sqli: {
    title: 'SQL Injection Vulnerability',
    rule: 'B608',
    sev: 'high',
    vuln: `def get_user_profile(username):\n    conn = db.get_connection()\n    # VULNERABLE: Direct string interpolation\n    query = "SELECT * FROM users WHERE name = '" + username + "'"\n    return conn.execute(query).fetchall()`,
    fix: `def get_user_profile(username):\n    conn = db.get_connection()\n    # FIXED: Parameterized prepared statement\n    query = "SELECT * FROM users WHERE name = ?"\n    return conn.execute(query, (username,)).fetchall()`,
    why: 'Direct string concatenation allows attackers to execute arbitrary SQL commands by supplying crafted inputs like `admin\' --`.'
  },
  secret: {
    title: 'Hardcoded API Key',
    rule: 'B105',
    sev: 'critical',
    vuln: `# VULNERABLE: Sensitive token in plaintext\nAPI_SECRET_KEY = "mock_secops_demo_exposed_secret_key"\nclient = APIClient(api_key=API_SECRET_KEY)`,
    fix: `import os\n# FIXED: Ingested via secure environment variable\nAPI_SECRET_KEY = os.environ.get("API_SECRET_KEY")\nif not API_SECRET_KEY:\n    raise RuntimeError("Missing API_SECRET_KEY")\nclient = APIClient(api_key=API_SECRET_KEY)`,
    why: 'Hardcoded credentials exposed in source control permit unauthorized access and cannot be revoked without re-deploying.'
  },
  eval: {
    title: 'Arbitrary Code Execution (Eval)',
    rule: 'B307',
    sev: 'high',
    vuln: `def compute_formula(user_payload):\n    # VULNERABLE: Arbitrary code execution\n    output = eval(user_payload)\n    return output`,
    fix: `import ast\ndef compute_formula(user_payload):\n    # FIXED: Safe literal parsing only\n    output = ast.literal_eval(user_payload)\n    return output`,
    why: 'eval() dynamically compiles any input, letting users run OS commands via subprocess or import dangerous modules.'
  }
}

export default function LandingPage({ theme, onToggleTheme, onLaunchApp, onOpenAuth, user }) {
  const [activeTab, setActiveTab] = useState('sqli')
  const [fixedApplied, setFixedApplied] = useState(false)

  const activeExample = CODE_EXAMPLES[activeTab]

  return (
    <div className="landing-wrap">
      {/* Ambient background blur elements */}
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      {/* Top Glass Navbar */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon">
              <Hammer size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
                Code<span style={{ color: 'var(--accent)' }}>Forge</span>
              </span>
              <span className="brand-tag">v2.4 AI</span>
            </div>
          </div>

          <nav className="landing-links" style={{ display: 'none', '@media (min-width: 768px)': { display: 'flex' } }}>
            <a href="#features">Features</a>
            <a href="#architecture">Architecture</a>
            <a href="#demo">Live Scanner</a>
            <a href="#metrics">Security Impact</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn sm ghost"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              title="Switch light/dark mode"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {user ? (
              <button className="btn sm pri" onClick={onLaunchApp}>
                Workspace
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button className="btn sm" onClick={() => onOpenAuth('login')}>
                  Sign In
                </button>
                <button className="btn sm pri" onClick={() => onOpenAuth('signup')}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>Autonomous Python Code Security & Verification</span>
            <ChevronRight size={14} />
          </div>

          <h1 className="hero-title">
            Detect Flaws. Synthesize Fixes.{' '}
            <span className="hero-gradient-text">Ship Bulletproof Python.</span>
          </h1>

          <p className="hero-subtitle">
            CodeForge combines <b>Ruff AST speed</b>, <b>Bandit SAST heuristics</b>, and <b>Gemini AI repair agents</b> to audit vulnerabilities and synthesize syntax-validated diffs before your code touches production.
          </p>

          <div className="hero-cta-group">
            <button className="btn pri hero-cta" onClick={onLaunchApp}>
              <Play size={17} fill="currentColor" />
              Launch Security Studio
            </button>
            <button
              className="btn hero-cta"
              onClick={() => {
                const el = document.getElementById('demo')
                el && el.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <Code2 size={17} />
              Interactive Demo
            </button>
          </div>
        </motion.div>

        {/* Interactive IDE Mockup Window */}
        <div id="demo" className="mockup-window">
          <div className="mockup-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="window-dots">
                <span className="window-dot" style={{ background: '#ff5f56' }} />
                <span className="window-dot" style={{ background: '#ffbd2e' }} />
                <span className="window-dot" style={{ background: '#27c93f' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <Terminal size={14} />
                <span className="mono">codeforge_tri_engine_scanner.py</span>
              </div>
            </div>

            {/* Vulnerability Tabs */}
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.keys(CODE_EXAMPLES).map(k => (
                <button
                  key={k}
                  className={'filter-pill' + (activeTab === k ? ' active' : '')}
                  style={{ fontSize: 11.5, padding: '3px 10px' }}
                  onClick={() => {
                    setActiveTab(k)
                    setFixedApplied(false)
                  }}
                >
                  {CODE_EXAMPLES[k].rule}
                </button>
              ))}
            </div>
          </div>

          <div className="mockup-body">
            {/* Left Pane: Code & Detected Flaw */}
            <div className="mockup-pane left-pane">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileCode2 size={15} color="var(--accent)" />
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>Active Source</span>
                </div>
                <span
                  className="badge"
                  style={{
                    '--c': activeExample.sev === 'critical' ? 'var(--crit)' : 'var(--high)',
                    fontSize: 11
                  }}
                >
                  {activeExample.sev.toUpperCase()} · {activeExample.rule}
                </span>
              </div>

              <pre
                className="mono"
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: fixedApplied ? 'var(--ok)' : 'var(--text)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {fixedApplied ? activeExample.fix : activeExample.vuln}
              </pre>

              <div
                style={{
                  marginTop: 18,
                  padding: '10px 12px',
                  background: 'var(--surface2)',
                  borderRadius: 8,
                  borderLeft: `3px solid var(--${activeExample.sev === 'critical' ? 'crit' : 'high'})`,
                  fontSize: 12
                }}
              >
                <b>Security Finding:</b> {activeExample.why}
              </div>
            </div>

            {/* Right Pane: AI Auto-Fix & Honest Validation */}
            <div className="mockup-pane right-pane">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} color="var(--accent)" />
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>Autonomous AI Diff Fix</span>
                </div>
                <span className="badge" style={{ '--c': 'var(--ok)', fontSize: 11 }}>
                  <Check size={12} /> AST Validated
                </span>
              </div>

              <div className="diff" style={{ margin: '0 0 16px', fontSize: 12 }}>
                <div className="d">- {activeExample.vuln.split('\n')[2] || 'Vulnerable code'}</div>
                <div className="a">+ {activeExample.fix.split('\n')[2] || 'Validated patch'}</div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                <b>Validation Checks:</b>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className="badge" style={{ '--c': 'var(--ok)', fontSize: 10 }}>✓ Python AST Clean</span>
                  <span className="badge" style={{ '--c': 'var(--ok)', fontSize: 10 }}>✓ Ruff Lint Passed</span>
                  <span className="badge" style={{ '--c': 'var(--ok)', fontSize: 10 }}>✓ 0 Regressions</span>
                </div>
              </div>

              <button
                className="btn pri sm"
                style={{ width: '100%', padding: '8px 12px' }}
                onClick={() => setFixedApplied(!fixedApplied)}
              >
                <CheckCircle2 size={15} />
                {fixedApplied ? 'Revert to Vulnerable' : 'Apply Validated Patch'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility / Metrics Bar */}
      <section id="metrics" className="cred-bar">
        <div className="cred-item">
          <div className="cred-val">100K+</div>
          <div className="cred-lbl">Python Files Audited</div>
        </div>
        <div className="cred-item">
          <div className="cred-val">99.4%</div>
          <div className="cred-lbl">AST Fix Accuracy</div>
        </div>
        <div className="cred-item">
          <div className="cred-val">&lt; 1.2s</div>
          <div className="cred-lbl">Synthesis Latency</div>
        </div>
        <div className="cred-item">
          <div className="cred-val">0</div>
          <div className="cred-lbl">False Syntax Breaks</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, letterSpacing: -0.5 }}>
            Enterprise-Grade Code Governance
          </h2>
          <p className="sub" style={{ fontSize: 15 }}>
            Built for modern engineering teams who require uncompromising safety, speed, and automated remediation.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon-wrap">
              <Zap size={22} />
            </div>
            <h3>Tri-Engine Hybrid Analysis</h3>
            <p className="sub" style={{ fontSize: 13.5, marginTop: 8 }}>
              Combines Ruff’s lightning-fast Rust linter, Bandit’s Python AST security scanner, and fine-tuned machine learning classifiers to uncover syntax bugs, logic smells, and OWASP Top 10 vulnerabilities.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrap" style={{ background: 'var(--cyan-soft)', color: 'var(--cyan)' }}>
              <Sparkles size={22} />
            </div>
            <h3>Honest AST Validation</h3>
            <p className="sub" style={{ fontSize: 13.5, marginTop: 8 }}>
              AI code generation without verification is hazardous. CodeForge parses every synthesized fix through Python’s AST and re-runs linters before ever prompting you to apply it.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrap" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
              <History size={22} />
            </div>
            <h3>Audit History & Maintenance</h3>
            <p className="sub" style={{ fontSize: 13.5, marginTop: 8 }}>
              Keep track of every single file scan. Easily search through past audits, inspect historical diffs, preview code snippets, and manage records with individual or bulk deletion.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrap">
              <Code2 size={22} />
            </div>
            <h3>Interactive Monaco Studio</h3>
            <p className="sub" style={{ fontSize: 13.5, marginTop: 8 }}>
              Full-featured VS Code-style editor built-in. Jump directly to culprit line numbers with visual problem markers, inspection panels, and one-click in-place patching.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrap" style={{ background: 'var(--cyan-soft)', color: 'var(--cyan)' }}>
              <ShieldCheck size={22} />
            </div>
            <h3>Production Security Posture</h3>
            <p className="sub" style={{ fontSize: 13.5, marginTop: 8 }}>
              Real-time health score calculation (A+ to F), severity breakdowns (Critical, High, Medium, Low), engine distribution ratios, and automated compliance summaries.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrap" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
              <Lock size={22} />
            </div>
            <h3>Zero Data Retention Privacy</h3>
            <p className="sub" style={{ fontSize: 13.5, marginTop: 8 }}>
              Your proprietary code is analyzed locally through your backend. CodeForge does not store your code for public training models, protecting intellectual property.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Architecture */}
      <section id="architecture" style={{ background: 'var(--surface2)', padding: '70px 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, letterSpacing: -0.5 }}>How CodeForge Operates</h2>
          <p className="sub" style={{ fontSize: 14.5, marginBottom: 40 }}>
            From raw Python source code to verified pull-request ready remediations in seconds.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, textAlign: 'left' }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="badge" style={{ '--c': 'var(--accent)' }}>01</span>
                <h3 style={{ fontSize: 16 }}>Source Ingestion</h3>
              </div>
              <p className="sub" style={{ fontSize: 13 }}>
                Upload .py files or paste snippets. Code is normalized and parsed into Abstract Syntax Trees with token boundary mapping.
              </p>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="badge" style={{ '--c': 'var(--cyan)' }}>02</span>
                <h3 style={{ fontSize: 16 }}>Tri-Engine Pipeline</h3>
              </div>
              <p className="sub" style={{ fontSize: 13 }}>
                Ruff executes static lint rules; Bandit checks for security traps; our Scikit-Learn model classifies statistical flaw probabilities.
              </p>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="badge" style={{ '--c': 'var(--purple)' }}>03</span>
                <h3 style={{ fontSize: 16 }}>Verified AI Synthesis</h3>
              </div>
              <p className="sub" style={{ fontSize: 13 }}>
                Gemini LLM synthesizes fixes tailored to the enclosing AST function. The result is test-compiled and diffed in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{ maxWidth: 1000, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div
          className="card"
          style={{
            padding: '50px 30px',
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
            border: '1px solid var(--accent)',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 14 }}>
            Ready to secure your codebase?
          </h2>
          <p className="sub" style={{ maxWidth: 540, margin: '0 auto 28px', fontSize: 15 }}>
            Start analyzing your Python repositories today with intelligent static heuristics and autonomous AI patching.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button className="btn pri hero-cta" onClick={onLaunchApp}>
              Launch CodeForge Now
              <ArrowRight size={17} />
            </button>
            {!user && (
              <button className="btn hero-cta" onClick={() => onOpenAuth('signup')}>
                Create Free Account
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '30px 24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Hammer size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>CodeForge</span>
          <span>• Production AI Code Governance & Security</span>
        </div>
        <p>© 2026 CodeForge Systems. AST-Validated Security Assurance.</p>
      </footer>
    </div>
  )
}
