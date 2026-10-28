import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  ClipboardPaste,
  FileCode2,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  X,
  Code2,
  ShieldAlert,
  Cpu,
  Wrench,
  Check,
  FileCheck
} from 'lucide-react'
import { STAGES } from './data'

const MAX_FILE_SIZE = 250 * 1024 // 250 KB

const SAMPLE_TEMPLATES = [
  {
    label: 'SQL Injection Sample',
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
`
  },
  {
    label: 'Hardcoded Secret & Subprocess',
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
`
  },
  {
    label: 'Clean Python Service',
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
`
  }
]

export default function NewAnalysis({ onDone }) {
  const [tab, setTab] = useState('upload') // 'upload' | 'paste'
  const [over, setOver] = useState(false)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState(-1) // -1 = not started
  const [id, setId] = useState(null)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const fi = useRef(null)

  const handleFileSelect = selectedFile => {
    setError('')
    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.py')) {
      setError('Only Python source files (.py) are supported. Please select a valid .py file.')
      setFile(null)
      setCode('')
      setFileName('')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size (${(selectedFile.size / 1024).toFixed(1)} KB) exceeds the 250 KB limit.`)
      setFile(null)
      setCode('')
      setFileName('')
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      setCode(e.target.result)
      setFile(selectedFile)
      setFileName(selectedFile.name)
      setSelectedTemplate('')
      setError('')
    }
    reader.onerror = () => {
      setError('Failed to read the selected file. Please try again.')
    }
    reader.readAsText(selectedFile)
  }

  const applyTemplate = tmpl => {
    setCode(tmpl.code)
    setFileName(tmpl.filename)
    setSelectedTemplate(tmpl.label)
    setFile({ name: tmpl.filename, size: tmpl.code.length })
    setError('')
  }

  const clearSelection = () => {
    setFile(null)
    setFileName('')
    setCode('')
    setSelectedTemplate('')
    setError('')
  }

  const ready = code.trim().length > 0 && !error
  const running = stage >= 0
  const linesCount = code.trim() ? code.split('\n').length : 0

  const start = async () => {
    setError('')
    if (!code.trim()) {
      setError('Please provide or upload Python code before starting analysis.')
      return
    }
    try {
      const res = await fetch('/api/analyses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          filename: fileName.trim() ? fileName.trim() : 'pasted_module.py'
        })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to start analysis.')
      }
      const data = await res.json()
      setId(data.id)
      setStage(data.stage)
    } catch (err) {
      setError(err.message || 'Could not start analysis. Ensure backend is running.')
    }
  }

  // Poll progress from backend
  useEffect(() => {
    if (!id) return
    const t = setInterval(async () => {
      try {
        const d = await (await fetch(`/api/analyses/${id}/`)).json()
        setStage(d.stage)
        if (d.status === 'COMPLETED') {
          clearInterval(t)
          setTimeout(() => onDone(id), 600)
        }
        if (d.status === 'FAILED') {
          clearInterval(t)
          setStage(-1)
          setId(null)
          setError('Analysis encountered an unhandled syntax or runtime error in the code.')
        }
      } catch {
        /* poll retry */
      }
    }, 1000)
    return () => clearInterval(t)
  }, [id])

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', width: '100%' }}>
      {/* Top Header with spacious margin */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Initialize Code Security Analysis</h1>
          <span className="badge" style={{ '--c': 'var(--accent)' }}>
            Production Tri-Engine
          </span>
        </div>
        <p className="sub" style={{ fontSize: 14 }}>
          Upload Python files or paste code to run parallel Ruff AST verification, Bandit SAST security scans, and Machine Learning flaw heuristics with automated Gemini AI fixes.
        </p>
      </div>

      {!running ? (
        <div className="card" style={{ padding: '28px 32px' }}>
          {/* Spacious Mode Switcher */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'var(--surface2)',
              padding: 6,
              borderRadius: 12,
              gap: 8,
              marginBottom: 26
            }}
          >
            <button
              type="button"
              className={'auth-tab-btn' + (tab === 'upload' ? ' active' : '')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 600
              }}
              onClick={() => {
                setTab('upload')
                setError('')
              }}
            >
              <Upload size={17} />
              <span>Upload .py File</span>
            </button>

            <button
              type="button"
              className={'auth-tab-btn' + (tab === 'paste' ? ' active' : '')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 600
              }}
              onClick={() => {
                setTab('paste')
                setError('')
              }}
            >
              <ClipboardPaste size={17} />
              <span>Paste / Direct Code Editor</span>
            </button>
          </div>

          {/* Quick Demo Templates Row */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Test Samples:
              </span>
              {code.trim() && (
                <button
                  type="button"
                  className="btn sm ghost"
                  style={{ fontSize: 12, color: 'var(--crit)' }}
                  onClick={clearSelection}
                >
                  <X size={13} />
                  Reset / Clear
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SAMPLE_TEMPLATES.map(t => (
                <button
                  key={t.label}
                  type="button"
                  className={'filter-pill' + (selectedTemplate === t.label ? ' active' : '')}
                  onClick={() => applyTemplate(t)}
                  style={{ fontSize: 12.5, padding: '6px 14px' }}
                >
                  <Sparkles size={13} style={{ marginRight: 4 }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab 1: Upload File Mode */}
          {tab === 'upload' && (
            <div style={{ marginBottom: 24 }}>
              {!file ? (
                <div
                  className={'drop' + (over ? ' over' : '')}
                  role="button"
                  tabIndex={0}
                  style={{ padding: '52px 24px', textAlign: 'center' }}
                  onClick={() => fi.current && fi.current.click()}
                  onKeyDown={e => e.key === 'Enter' && fi.current && fi.current.click()}
                  onDragOver={e => {
                    e.preventDefault()
                    setOver(true)
                  }}
                  onDragLeave={() => setOver(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setOver(false)
                    handleFileSelect(e.dataTransfer.files[0])
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}
                  >
                    <Upload size={28} />
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                    Drag & drop your Python file here, or click to browse
                  </h3>
                  <p className="sub" style={{ fontSize: 13, margin: '0 auto', maxWidth: 440 }}>
                    Supports standalone <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>.py</span> files up to 250 KB with complete syntax and function scope extraction.
                  </p>

                  <input
                    ref={fi}
                    type="file"
                    accept=".py"
                    hidden
                    onChange={e => handleFileSelect(e.target.files[0])}
                  />
                </div>
              ) : (
                /* Selected File Card */
                <div
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--accent)',
                    borderRadius: 12,
                    padding: '20px 24px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: 'var(--accent-soft)',
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FileCheck size={24} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                            {fileName || file.name}
                          </span>
                          <span className="badge" style={{ '--c': 'var(--ok)' }}>
                            Ready
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                          <span>Size: {(file.size / 1024).toFixed(1)} KB</span>
                          <span>·</span>
                          <span>{linesCount} Lines of code</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => fi.current && fi.current.click()}
                      >
                        Replace File
                      </button>
                      <button
                        type="button"
                        className="btn sm danger"
                        onClick={clearSelection}
                        title="Remove file"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Code preview snippet */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>
                      Source Preview (First 8 lines):
                    </div>
                    <pre
                      className="mono"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '12px 16px',
                        fontSize: 12.5,
                        lineHeight: 1.5,
                        maxHeight: 140,
                        overflow: 'auto',
                        color: 'var(--text)'
                      }}
                    >
                      {code.split('\n').slice(0, 8).join('\n')}
                      {code.split('\n').length > 8 ? '\n...' : ''}
                    </pre>
                  </div>

                  <input
                    ref={fi}
                    type="file"
                    accept=".py"
                    hidden
                    onChange={e => handleFileSelect(e.target.files[0])}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Paste Code Mode */}
          {tab === 'paste' && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label
                  htmlFor="filename-input"
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <FileCode2 size={15} color="var(--accent)" />
                  Target Module Name:
                </label>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {linesCount} lines · {code.length} characters
                </span>
              </div>

              <input
                id="filename-input"
                type="text"
                placeholder="e.g. auth_controller.py"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                className="mono"
                style={{ marginBottom: 14, fontSize: 13 }}
              />

              <div style={{ position: 'relative' }}>
                <textarea
                  id="code"
                  value={code}
                  onChange={e => {
                    setCode(e.target.value)
                    setError('')
                  }}
                  placeholder="Paste Python source code here (e.g. def handle_request(req): ...)"
                  style={{
                    minHeight: 280,
                    padding: 16,
                    lineHeight: 1.55,
                    fontSize: 13,
                    borderRadius: 10,
                    background: 'var(--surface2)',
                    borderColor: 'var(--border)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Diagnostic Options Overview */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 10,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12.5 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>
                <Wrench size={14} color="var(--accent)" />
                <b>Ruff AST Linter:</b> Enabled
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>
                <ShieldAlert size={14} color="var(--cyan)" />
                <b>Bandit SAST:</b> Active
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>
                <Cpu size={14} color="var(--purple)" />
                <b>ML Classifier:</b> Active
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ok)', fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              <span>AST Validation Auto-Enabled</span>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  background: 'var(--crit-soft)',
                  border: '1px solid var(--crit)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  color: 'var(--crit)',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 18
                }}
              >
                <AlertTriangle size={17} flexShrink={0} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Action Footer with generous spacing */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {ready ? (
                <span style={{ color: 'var(--ok)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={14} />
                  Ready to audit: {fileName || (tab === 'upload' ? 'Uploaded file' : 'Pasted snippet')} ({linesCount} lines)
                </span>
              ) : (
                'Select or paste Python code to enable scan'
              )}
            </div>

            <button
              type="button"
              className="btn pri"
              disabled={!ready}
              onClick={start}
              style={{ padding: '11px 24px', fontSize: 14.5, borderRadius: 10 }}
            >
              <Play size={16} fill="currentColor" />
              <span>Execute Tri-Engine Audit</span>
            </button>
          </div>
        </div>
      ) : (
        /* Running Progress State */
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ maxWidth: 540, margin: '0 auto', padding: '36px 32px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <RotateCcw size={26} className="spin" />
            </div>
            <h2 style={{ fontSize: 20 }}>Audit in Progress</h2>
            <p className="sub" style={{ fontSize: 13, margin: '4px 0 0' }}>
              Analyzing <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{fileName || 'code'}</span> through our multi-engine verification pipeline
            </p>
          </div>

          <ul className="steps" aria-live="polite" style={{ gap: 14 }}>
            {STAGES.map((s, i) => (
              <li
                key={s}
                className={'step' + (i < stage ? ' done' : '')}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: i === stage ? 'var(--accent-soft)' : i < stage ? 'var(--surface2)' : 'transparent',
                  border: i === stage ? '1px solid var(--accent)' : '1px solid transparent',
                  fontWeight: i === stage ? 600 : 400
                }}
              >
                {i < stage ? (
                  <CheckCircle2 size={19} color="var(--ok)" />
                ) : i === stage ? (
                  <RotateCcw size={19} className="spin" color="var(--accent)" />
                ) : (
                  <Circle size={19} color="var(--text-dim)" />
                )}
                <span style={{ color: i === stage ? 'var(--text)' : undefined }}>{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}