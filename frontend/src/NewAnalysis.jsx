import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import {
  Upload,
  FileCode2,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  X,
  ShieldAlert,
  Cpu,
  Wrench,
  Check,
  Terminal,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  GripVertical,
  GripHorizontal,
  Maximize2,
  Minimize2,
  RefreshCw,
  Code2
} from 'lucide-react'
import { STAGES } from './data'

const MAX_FILE_SIZE = 250 * 1024

const SAMPLE_TEMPLATES = [
  {
    label: 'SQL Injection',
    filename: 'vulnerable_auth.py',
    code: `import sqlite3

def authenticate_user(username, password):
    conn = sqlite3.connect("production.db")
    # SECURITY FLAW: Direct string concatenation allows SQL injection
    query = "SELECT id, role, password_hash FROM users WHERE username = '" + username + "'"
    cursor = conn.cursor()
    cursor.execute(query)
    user = cursor.fetchone()

    if user and user[2] == password:
        return {"status": "success", "user_id": user[0], "role": user[1]}
    return {"status": "failed", "message": "Invalid credentials"}
`,
  },
  {
    label: 'Hardcoded Secret',
    filename: 'payment_processor.py',
    code: `import subprocess
import os

# CRITICAL SECURITY RISK: Hardcoded secret key in plaintext source
API_SECRET_KEY = "mock_secops_demo_exposed_secret_key_sample"

def run_backup_job(directory_path):
    # VULNERABLE: shell=True with unescaped input parameter
    command = "tar -czf backup.tar.gz " + directory_path
    subprocess.call(command, shell=True)

def initialize_gateway():
    return {"key": API_SECRET_KEY, "status": "active"}
`,
  },
  {
    label: 'Clean Service',
    filename: 'clean_service.py',
    code: `import os
from typing import Optional

class ConfigurationManager:
    """Manages application settings loaded securely from environment variables."""
    def __init__(self) -> None:
        self.api_key: Optional[str] = os.getenv("APP_API_KEY")
        self.debug_mode: bool = os.getenv("APP_DEBUG", "false").lower() == "true"

    def is_configured(self) -> bool:
        return bool(self.api_key)
`,
  },
]

// ─── Resizable Divider hook ────────────────────────────────────────────────
function useResize({ direction, initial, min, max, containerRef }) {
  const [size, setSize] = useState(initial)
  const dragging = useRef(false)
  const startPos = useRef(0)
  const startSize = useRef(0)

  const onMouseDown = useCallback(e => {
    e.preventDefault()
    dragging.current = true
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY
    startSize.current = size
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }, [direction, size])

  useEffect(() => {
    const onMove = e => {
      if (!dragging.current) return
      const delta = direction === 'horizontal'
        ? e.clientX - startPos.current
        : e.clientY - startPos.current
      const container = containerRef?.current
      const containerSize = container
        ? (direction === 'horizontal' ? container.offsetWidth : container.offsetHeight)
        : 0
      let next = startSize.current + delta
      if (containerSize > 0) {
        next = Math.min(Math.max(next, min || 200), max || containerSize - 200)
      } else {
        next = Math.min(Math.max(next, min || 200), max || 1200)
      }
      setSize(next)
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [direction, min, max, containerRef])

  return [size, onMouseDown]
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function NewAnalysis({ onDone, theme, onCodeChange }) {
  const [code, setCode] = useState('')
  const [fileName, setFileName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [error, setError] = useState('')

  // Run state
  const [runLoading, setRunLoading] = useState(false)
  const [runOutput, setRunOutput] = useState(null)
  const [activeTab, setActiveTab] = useState('output') // 'output' | 'info'

  // Analysis state
  const [stage, setStage] = useState(-1)
  const [analysisId, setAnalysisId] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const fi = useRef(null)
  const containerRef = useRef(null)
  const rightRef = useRef(null)

  // Left panel width (horizontal split)
  const [leftW, onDragH] = useResize({
    direction: 'horizontal',
    initial: 580,
    min: 280,
    max: 900,
    containerRef,
  })

  // Right-panel vertical split: editor top height
  const [topH, onDragV] = useResize({
    direction: 'vertical',
    initial: 340,
    min: 120,
    max: 620,
    containerRef: rightRef,
  })

  // ── File select ──────────────────────────────────────────────────────
  const handleFileSelect = selectedFile => {
    setError('')
    if (!selectedFile) return
    if (!selectedFile.name.toLowerCase().endsWith('.py')) {
      setError('Only Python (.py) files are supported.')
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File too large (${(selectedFile.size / 1024).toFixed(1)} KB). Max 250 KB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      setCode(e.target.result)
      setFileName(selectedFile.name)
      setSelectedTemplate('')
      setRunOutput(null)
      onCodeChange?.(e.target.result)
    }
    reader.onerror = () => setError('Could not read file.')
    reader.readAsText(selectedFile)
  }

  const applyTemplate = tmpl => {
    setCode(tmpl.code)
    setFileName(tmpl.filename)
    setSelectedTemplate(tmpl.label)
    setRunOutput(null)
    setError('')
    onCodeChange?.(tmpl.code)
  }

  const clearAll = () => {
    setCode('')
    setFileName('')
    setSelectedTemplate('')
    setError('')
    setRunOutput(null)
    setStage(-1)
    setAnalysisId(null)
    setAnalyzing(false)
  }

  // ── Run Code ──────────────────────────────────────────────────────────
  const runCode = async () => {
    if (!code.trim()) { setError('Write or upload Python code first.'); return }
    setError('')
    setRunLoading(true)
    setRunOutput(null)
    setActiveTab('output')
    try {
      const res = await fetch('/api/compiler/run/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'python', stdin: '' }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Execution failed.')
      }
      setRunOutput(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setRunLoading(false)
    }
  }

  // ── Analyze Code ──────────────────────────────────────────────────────
  const startAnalysis = async () => {
    if (!code.trim()) { setError('Write or upload Python code first.'); return }
    setError('')
    setAnalyzing(true)
    setStage(0)
    try {
      const token = localStorage.getItem('cf_token')
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {}

      const res = await fetch('/api/analyses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          code,
          filename: fileName.trim() || 'pasted_module.py',
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Analysis failed to start.')
      }
      const data = await res.json()
      setAnalysisId(data.id)
      setStage(data.stage)
    } catch (err) {
      setError(err.message)
      setAnalyzing(false)
      setStage(-1)
    }
  }

  useEffect(() => {
    if (!analysisId) return
    const t = setInterval(async () => {
      try {
        const d = await (await fetch(`/api/analyses/${analysisId}/`)).json()
        setStage(d.stage)
        if (d.status === 'COMPLETED') {
          clearInterval(t)
          setTimeout(() => onDone(analysisId), 500)
        }
        if (d.status === 'FAILED') {
          clearInterval(t)
          setStage(-1)
          setAnalysisId(null)
          setAnalyzing(false)
          setError('Analysis failed — check code for syntax errors.')
        }
      } catch { /* retry */ }
    }, 1000)
    return () => clearInterval(t)
  }, [analysisId])

  const linesCount = code.trim() ? code.split('\n').length : 0
  const ready = code.trim().length > 0

  // ── Analysis progress overlay ─────────────────────────────────────────
  if (analyzing && stage >= 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ width: '100%', maxWidth: 500, padding: '36px 32px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <RotateCcw size={26} className="spin" />
            </div>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>Audit in Progress</h2>
            <p className="sub" style={{ fontSize: 13 }}>
              Analyzing <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{fileName || 'code'}</span>
            </p>
          </div>
          <ul className="steps" aria-live="polite" style={{ gap: 12 }}>
            {STAGES.map((s, i) => (
              <li key={s} className={'step' + (i < stage ? ' done' : '')}
                style={{
                  padding: '9px 14px', borderRadius: 8,
                  background: i === stage ? 'var(--accent-soft)' : i < stage ? 'var(--surface2)' : 'transparent',
                  border: i === stage ? '1px solid var(--accent)' : '1px solid transparent',
                  fontWeight: i === stage ? 600 : 400
                }}
              >
                {i < stage
                  ? <CheckCircle2 size={18} color="var(--ok)" />
                  : i === stage
                    ? <RotateCcw size={18} className="spin" color="var(--accent)" />
                    : <Circle size={18} color="var(--text-dim)" />}
                <span style={{ color: i === stage ? 'var(--text)' : undefined }}>{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    )
  }

  // ── Status badge color ─────────────────────────────────────────────────
  const statusColor = runOutput
    ? runOutput.status === 'SUCCESS' ? 'var(--ok)'
      : runOutput.status === 'TLE' ? 'var(--warn)'
        : 'var(--crit)'
    : null

  const statusLabel = runOutput
    ? runOutput.status === 'SUCCESS' ? '✓ Accepted'
      : runOutput.status === 'TLE' ? '⏱ Time Limit Exceeded'
        : '✕ Runtime Error'
    : null

  // ── Main LeetCode-style layout ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
        borderBottom: '1px solid var(--border)', background: 'var(--surface2)',
        flexShrink: 0, flexWrap: 'wrap', minHeight: 48
      }}>
        {/* File upload */}
        <button
          type="button" className="btn sm"
          onClick={() => fi.current && fi.current.click()}
          title="Upload .py file"
        >
          <Upload size={13} /> Upload .py
        </button>
        <input ref={fi} type="file" accept=".py" hidden
          onChange={e => { handleFileSelect(e.target.files[0]); e.target.value = '' }} />

        {/* Filename chip */}
        {fileName ? (
          <span className="mono" style={{
            fontSize: 12, background: 'var(--accent-soft)', color: 'var(--accent)',
            padding: '3px 9px', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600
          }}>
            <FileCode2 size={12} />
            {fileName}
            <button type="button" onClick={clearAll}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
              <X size={12} />
            </button>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>untitled.py</span>
        )}

        {/* Templates */}
        <div style={{ display: 'flex', gap: 5, marginLeft: 4 }}>
          {SAMPLE_TEMPLATES.map(t => (
            <button key={t.label} type="button"
              className={'filter-pill' + (selectedTemplate === t.label ? ' active' : '')}
              onClick={() => applyTemplate(t)}
              style={{ fontSize: 11.5, padding: '4px 11px' }}
            >
              <Sparkles size={11} style={{ marginRight: 3 }} />{t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Stats */}
        {ready && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {linesCount} lines · {code.length} chars
          </span>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: 'var(--border)' }} />

        {/* Run */}
        <button type="button" className="btn sm"
          disabled={!ready || runLoading}
          onClick={runCode}
          style={{
            borderColor: ready && !runLoading ? 'var(--ok)' : undefined,
            color: ready && !runLoading ? 'var(--ok)' : undefined, fontWeight: 700,
            minWidth: 100
          }}
        >
          {runLoading
            ? <><RotateCcw size={13} className="spin" /> Running…</>
            : <><Play size={13} fill="currentColor" /> Run Code</>}
        </button>

        {/* Analyze */}
        <button type="button" className="btn pri sm"
          disabled={!ready || analyzing}
          onClick={startAnalysis}
          style={{ fontWeight: 700, minWidth: 120 }}
        >
          {analyzing
            ? <><RotateCcw size={13} className="spin" /> Analyzing…</>
            : <><ShieldAlert size={13} /> Analyze Code</>}
        </button>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
              background: 'var(--crit-soft)', borderBottom: '1px solid var(--crit)',
              color: 'var(--crit)', fontSize: 13
            }}>
              <AlertTriangle size={15} />
              <span>{error}</span>
              <button type="button" onClick={() => setError('')}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Split Workspace ───────────────────────────────────────────────── */}
      <div ref={containerRef}
        style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ══ LEFT PANEL — Description / Info ════════════════════════════ */}
        <div style={{
          width: leftW, minWidth: 200, flexShrink: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRight: '1px solid var(--border)'
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface2)', flexShrink: 0
          }}>
            <Code2 size={14} color="var(--accent)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Description</span>
          </div>

          {/* Description content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 18px', fontSize: 13.5, lineHeight: 1.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Code Security Analysis</h2>
              <span className="badge" style={{ '--c': 'var(--accent)', fontSize: 11 }}>Python Only</span>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: 18, fontSize: 13 }}>
              Upload or write Python code, run it to verify output, then trigger a full tri-engine security audit.
            </p>

            {/* Workflow steps */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Workflow
              </div>
              {[
                { n: 1, title: 'Write or Upload', desc: 'Paste Python code into the editor or upload a .py file (max 250 KB).' },
                { n: 2, title: 'Run Code', desc: 'Execute the code in a sandboxed environment. Check stdout / stderr.' },
                { n: 3, title: 'Analyze Code', desc: 'Run Ruff AST, Bandit SAST, and ML classifier in parallel.' },
                { n: 4, title: 'View Results', desc: 'See detected issues, severity, confidence scores, and AI-generated fixes.' },
              ].map(s => (
                <div key={s.n} style={{
                  display: 'flex', gap: 12, marginBottom: 12,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--surface2)', border: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-soft)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800
                  }}>{s.n}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 3, fontSize: 13 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Engines */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Analysis Engines
            </div>
            {[
              { icon: <Wrench size={13} />, color: 'var(--accent)', label: 'Ruff AST Linter', desc: 'Style, imports, unused vars, code smells' },
              { icon: <ShieldAlert size={13} />, color: 'var(--cyan)', label: 'Bandit SAST', desc: 'Hardcoded secrets, injection, subprocess risks' },
              { icon: <Cpu size={13} />, color: 'var(--purple)', label: 'ML Classifier', desc: 'Trained on CWE/OWASP patterns, flaw scoring' },
            ].map(e => (
              <div key={e.label} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '8px 12px', borderRadius: 7, marginBottom: 8,
                background: 'var(--surface2)', border: '1px solid var(--border)'
              }}>
                <span style={{ color: e.color, marginTop: 2, flexShrink: 0 }}>{e.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 2 }}>{e.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{e.desc}</div>
                </div>
              </div>
            ))}

            {/* Constraints */}
            <div style={{
              marginTop: 18, padding: '10px 14px', borderRadius: 8,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: 12 }}>Constraints</div>
              <div>• Language: <b style={{ color: 'var(--text)' }}>Python only (.py)</b></div>
              <div>• Max file size: <b style={{ color: 'var(--text)' }}>250 KB</b></div>
              <div>• Execution timeout: <b style={{ color: 'var(--text)' }}>3 seconds</b></div>
              <div>• Runtime: <b style={{ color: 'var(--text)' }}>Sandboxed subprocess</b></div>
            </div>
          </div>
        </div>

        {/* ── Horizontal Drag Handle ───────────────────────────────────── */}
        <div
          onMouseDown={onDragH}
          title="Drag to resize"
          style={{
            width: 6, flexShrink: 0, cursor: 'col-resize', position: 'relative',
            background: 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
            zIndex: 10,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--border)'}
        >
          <GripVertical size={14} style={{ color: 'var(--text-dim)', pointerEvents: 'none' }} />
        </div>

        {/* ══ RIGHT PANEL — Editor + Output ══════════════════════════════ */}
        <div ref={rightRef}
          style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── Editor Section ───────────────────────────────────────── */}
          <div style={{ height: topH, minHeight: 80, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Editor tab bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              borderBottom: '1px solid var(--border)', background: 'var(--surface2)',
              flexShrink: 0, padding: '0 12px'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                borderBottom: '2px solid var(--accent)', padding: '8px 10px 7px',
                fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', cursor: 'default'
              }}>
                <FileCode2 size={13} />
                {fileName || 'untitled.py'}
              </div>
              <div style={{ flex: 1 }} />
              {ready && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={11} color="var(--ok)" /> {linesCount} lines
                </span>
              )}
              {code.trim() && (
                <button type="button" className="btn sm ghost"
                  onClick={clearAll}
                  style={{ fontSize: 11, color: 'var(--crit)', marginLeft: 8, padding: '3px 8px' }}
                  title="Clear editor"
                >
                  <RefreshCw size={11} /> Reset
                </button>
              )}
            </div>

            {/* Monaco editor fills remaining space */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Editor
                height="100%"
                language="python"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={code}
                onChange={val => { setCode(val || ''); setError(''); onCodeChange?.(val || '') }}
                options={{
                  fontSize: 13.5,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 10, bottom: 10 },
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  tabSize: 4,
                  renderLineHighlight: 'line',
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                }}
              />
            </div>
          </div>

          {/* ── Vertical Drag Handle ─────────────────────────────────── */}
          <div
            onMouseDown={onDragV}
            title="Drag to resize"
            style={{
              height: 6, flexShrink: 0, cursor: 'row-resize',
              background: 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s', zIndex: 10,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--border)'}
          >
            <GripHorizontal size={14} style={{ color: 'var(--text-dim)', pointerEvents: 'none' }} />
          </div>

          {/* ── Output Section ───────────────────────────────────────── */}
          <div style={{ flex: 1, minHeight: 60, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Output tab bar */}
            <div style={{
              display: 'flex', alignItems: 'center',
              borderBottom: '1px solid var(--border)', background: 'var(--surface2)',
              flexShrink: 0
            }}>
              {[
                { id: 'output', label: 'Output', icon: <Terminal size={13} /> },
                { id: 'info', label: 'Engines', icon: <Cpu size={13} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', fontSize: 12.5, fontWeight: 600, border: 'none',
                    background: 'none', cursor: 'pointer',
                    color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                    borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'color 0.15s',
                  }}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}

              {/* Status badge in tab bar */}
              {runOutput && activeTab === 'output' && (
                <span style={{
                  marginLeft: 8, fontSize: 12, fontWeight: 700,
                  color: statusColor, display: 'flex', alignItems: 'center', gap: 5
                }}>
                  {statusLabel}
                  {runOutput.time_ms != null && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={11} /> {runOutput.time_ms} ms
                    </span>
                  )}
                  {runOutput.memory_mb != null && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Zap size={11} /> {runOutput.memory_mb} MB
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
              {activeTab === 'output' && (
                <>
                  {runLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13, paddingTop: 8 }}>
                      <RotateCcw size={15} className="spin" color="var(--accent)" />
                      Executing Python code…
                    </div>
                  ) : !runOutput ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: 13 }}>
                      <Terminal size={28} style={{ marginBottom: 10, opacity: 0.35 }} />
                      <span>Click <b style={{ color: 'var(--text)' }}>Run Code</b> to execute and see output here.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {runOutput.stdout && (
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ok)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                            stdout
                          </div>
                          <pre className="mono" style={{
                            background: 'var(--surface2)', border: '1px solid var(--border)',
                            borderRadius: 7, padding: '10px 13px', fontSize: 12.5,
                            lineHeight: 1.6, maxHeight: 240, overflow: 'auto',
                            color: 'var(--text)', margin: 0, whiteSpace: 'pre-wrap'
                          }}>
                            {runOutput.stdout}
                          </pre>
                        </div>
                      )}
                      {runOutput.stderr && (
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--crit)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                            stderr / error
                          </div>
                          <pre className="mono" style={{
                            background: 'var(--crit-soft)', border: '1px solid var(--crit)',
                            borderRadius: 7, padding: '10px 13px', fontSize: 12.5,
                            lineHeight: 1.6, maxHeight: 200, overflow: 'auto',
                            color: 'var(--crit)', margin: 0, whiteSpace: 'pre-wrap'
                          }}>
                            {runOutput.stderr}
                          </pre>
                        </div>
                      )}
                      {!runOutput.stdout && !runOutput.stderr && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                          Program exited with no output.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                  {[
                    { icon: <Wrench size={14} />, color: 'var(--accent)', label: 'Ruff AST Linter', status: 'Enabled', desc: 'PEP 8, imports, unused vars, complexity, code smells' },
                    { icon: <ShieldAlert size={14} />, color: 'var(--cyan)', label: 'Bandit SAST', status: 'Active', desc: 'SQL injection, hardcoded secrets, insecure subprocess usage' },
                    { icon: <Cpu size={14} />, color: 'var(--purple)', label: 'ML Classifier', status: 'Active', desc: 'CWE/OWASP trained model with confidence scoring' },
                  ].map(e => (
                    <div key={e.label} style={{
                      display: 'flex', gap: 12, alignItems: 'center',
                      padding: '10px 14px', borderRadius: 8,
                      background: 'var(--surface2)', border: '1px solid var(--border)'
                    }}>
                      <span style={{ color: e.color }}>{e.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{e.label}</span>
                          <span className="badge" style={{ '--c': 'var(--ok)', fontSize: 10 }}>{e.status}</span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.desc}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, fontSize: 12,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', lineHeight: 1.7
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Runtime Constraints</div>
                    <div>• Execution timeout: 3 seconds</div>
                    <div>• Sandboxed subprocess (no network / fs write)</div>
                    <div>• Python 3 only — .py files up to 250 KB</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
