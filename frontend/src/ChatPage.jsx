import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Send,
  RotateCcw,
  Bot,
  User,
  Trash2,
  Sparkles,
  Code2,
  ShieldAlert,
  Copy,
  Check,
  Zap,
  Terminal,
  FileCode2,
  Cpu,
  HelpCircle,
  ArrowRight
} from 'lucide-react'

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    '### Welcome to CodeForge AI Assistant 👋\n\n' +
    "I'm your dedicated code security and Python quality companion powered by Gemini AI.\n\n" +
    '**What I can do for you:**\n' +
    '- **Audit & Explain Vulnerabilities:** Deep-dive into SQL injection, hardcoded secrets, shell injection, or tainted input.\n' +
    '- **Explain Static Analysis:** Demystify Bandit SAST (B608, B105, B307) and Ruff AST linter findings.\n' +
    '- **Synthesize Fixes:** Suggest secure, idiomatic replacement code with explanations.\n' +
    '- **General Software Engineering:** Answer Python architecture, algorithms, and design pattern questions.\n\n' +
    'Ask a question below or pick one of the quick prompts to get started!',
  id: 'welcome',
}

const QUICK_PROMPTS = [
  {
    icon: <ShieldAlert size={14} color="var(--crit)" />,
    title: 'Explain SQL Injection',
    prompt: 'Explain how SQL injection happens in Python sqlite3 and how to fix it using parameterized queries.'
  },
  {
    icon: <Zap size={14} color="var(--accent)" />,
    title: 'Review Active Code',
    prompt: 'Please review the active code currently loaded in my editor for security flaws and code smells.'
  },
  {
    icon: <Cpu size={14} color="var(--purple)" />,
    title: 'Bandit vs Ruff Differences',
    prompt: 'What is the architectural difference between Ruff AST linting and Bandit SAST security analysis?'
  },
  {
    icon: <Terminal size={14} color="var(--cyan)" />,
    title: 'Hardcoded Secret Remediation',
    prompt: 'How should API keys and database credentials be safely managed in a Python production environment?'
  }
]

// Markdown Renderer with code block syntax & copy button
function MarkdownRenderer({ text }) {
  if (!text) return null
  const [copiedIndex, setCopiedIndex] = useState(null)

  const copyCode = (codeText, index) => {
    navigator.clipboard.writeText(codeText)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const parts = text.split(/(```[\s\S]*?```)/g)

  return (
    <div style={{ lineHeight: 1.7, fontSize: 14 }}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```$/)
          const lang = match ? match[1] : ''
          const codeContent = match ? match[2].trim() : part.slice(3, -3).trim()

          return (
            <div
              key={i}
              style={{
                margin: '12px 0',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 12px',
                  background: 'var(--surface2)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 12,
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <span>{lang || 'code'}</span>
                <button
                  type="button"
                  onClick={() => copyCode(codeContent, i)}
                  className="btn sm ghost"
                  style={{ padding: '2px 8px', fontSize: 11.5, height: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {copiedIndex === i ? (
                    <>
                      <Check size={12} color="var(--ok)" />
                      <span style={{ color: 'var(--ok)' }}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre
                className="mono"
                style={{
                  padding: '12px 16px',
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.55,
                  overflowX: 'auto',
                  color: 'var(--text)',
                  whiteSpace: 'pre'
                }}
              >
                {codeContent}
              </pre>
            </div>
          )
        }

        // Render normal text with bullet points, bolding, and inline code
        const lines = part.split('\n')
        return (
          <div key={i}>
            {lines.map((line, j) => {
              if (line.startsWith('### ')) {
                return <h3 key={j} style={{ fontSize: 16, fontWeight: 700, margin: '14px 0 6px', color: 'var(--text)' }}>{line.slice(4)}</h3>
              }
              if (line.startsWith('## ')) {
                return <h2 key={j} style={{ fontSize: 18, fontWeight: 700, margin: '16px 0 8px', color: 'var(--text)' }}>{line.slice(3)}</h2>
              }
              if (line.startsWith('# ')) {
                return <h1 key={j} style={{ fontSize: 20, fontWeight: 800, margin: '18px 0 10px', color: 'var(--text)' }}>{line.slice(2)}</h1>
              }

              const isBullet = /^[-•*]\s/.test(line.trim())
              const content = line.replace(/^[-•*]\s/, '')

              const renderedInline = content.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((seg, k) => {
                if (seg.startsWith('`') && seg.endsWith('`')) {
                  return (
                    <code
                      key={k}
                      className="mono"
                      style={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontSize: 12.5,
                        color: 'var(--accent)'
                      }}
                    >
                      {seg.slice(1, -1)}
                    </code>
                  )
                }
                if (seg.startsWith('**') && seg.endsWith('**')) {
                  return <strong key={k}>{seg.slice(2, -2)}</strong>
                }
                return seg
              })

              if (isBullet) {
                return (
                  <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 3 }}>•</span>
                    <span>{renderedInline}</span>
                  </div>
                )
              }
              return line ? <p key={j} style={{ margin: '6px 0' }}>{renderedInline}</p> : <br key={j} />
            })}
          </div>
        )
      })}
    </div>
  )
}

export default function ChatPage({ code = '', analysisContext = '' }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showContextPane, setShowContextPane] = useState(true)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async textToSend => {
    const text = (textToSend || input).trim()
    if (!text || loading) return

    setInput('')
    setError('')

    const userMsg = { role: 'user', content: text, id: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    // Build history excluding welcome and error messages
    const history = newMessages
      .filter(m => m.id !== 'welcome' && !m.isError)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

    try {
      const res = await fetch('/api/chatbot/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          code: code || '',
          context: analysisContext || ''
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server responded with HTTP ${res.status}`)
      }

      const data = await res.json()
      if (!data.reply) throw new Error('No response generated by AI model.')

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply, id: Date.now() + 1 }
      ])
    } catch (err) {
      const errMsg = err.message || 'Could not communicate with AI service.'
      setError(errMsg)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **AI Service Notice:** ${errMsg}\n\nPlease check your configuration or retry.`,
          id: Date.now() + 1,
          isError: true
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE])
    setError('')
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>CodeForge AI Assistant</h1>
              <span className="badge" style={{ '--c': 'var(--ok)', fontSize: 11 }}>
                ● Gemini 3.5 Active
              </span>
            </div>
            <p className="sub" style={{ fontSize: 12.5, margin: '2px 0 0' }}>
              Conversational code auditor, vulnerability explainer, and automated repair synthesis
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className={'btn sm ' + (showContextPane ? 'sec' : 'ghost')}
            onClick={() => setShowContextPane(!showContextPane)}
            title="Toggle Code & Findings Context Pane"
          >
            <Code2 size={14} />
            <span>{showContextPane ? 'Hide Code Context' : 'Show Code Context'}</span>
          </button>

          <button
            type="button"
            className="btn sm ghost"
            onClick={clearChat}
            style={{ color: 'var(--text-muted)' }}
            title="Clear Chat History"
          >
            <Trash2 size={14} />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* ── Main Workspace Body (Split view in big window size) ────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side: Large Conversation Window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Scrollable Chat Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {messages.map(m => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  maxWidth: m.role === 'user' ? '80%' : '90%',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: m.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                    color: m.role === 'user' ? '#fff' : 'var(--accent)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {m.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: m.role === 'user' ? 'var(--accent)' : m.isError ? 'var(--crit-soft)' : 'var(--surface2)',
                    color: m.role === 'user' ? '#fff' : m.isError ? 'var(--crit)' : 'var(--text)',
                    border: m.role === 'user' ? 'none' : m.isError ? '1px solid var(--crit)' : '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    minWidth: 120
                  }}
                >
                  {m.role === 'user' ? (
                    <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  ) : (
                    <MarkdownRenderer text={m.content} />
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', gap: 14, alignItems: 'center' }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)'
                  }}
                >
                  <Bot size={18} />
                </div>
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '4px 16px 16px 16px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        display: 'inline-block',
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
                      }}
                    />
                  ))}
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)', marginLeft: 8 }}>
                    CodeForge Assistant is thinking...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Cards (Shown when conversation is short) */}
          {messages.length <= 2 && !loading && (
            <div style={{ padding: '0 32px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Suggested Prompts
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                {QUICK_PROMPTS.map(qp => (
                  <button
                    key={qp.title}
                    type="button"
                    onClick={() => send(qp.prompt)}
                    className="card"
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      transition: 'border-color 0.15s, transform 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{ marginTop: 2 }}>{qp.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {qp.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {qp.prompt.slice(0, 70)}...
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <div
            style={{
              padding: '16px 32px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              flexShrink: 0
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 10,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '10px 14px',
                transition: 'border-color 0.15s'
              }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Ask about Python vulnerabilities, Bandit SAST rules, or request a code fix..."
                disabled={loading}
                rows={1}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  outline: 'none',
                  fontSize: 14,
                  color: 'var(--text)',
                  lineHeight: 1.5,
                  maxHeight: 120,
                  overflowY: 'auto',
                  padding: 0,
                  fontFamily: 'inherit'
                }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />

              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="btn pri sm"
                style={{
                  borderRadius: 10,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {loading ? <RotateCcw size={15} className="spin" /> : <Send size={15} />}
                <span>Send</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11.5, color: 'var(--text-dim)' }}>
              <span>Press <b>Enter</b> to send · <b>Shift + Enter</b> for new line</span>
              <span>Gemini 3.5 AI · CodeForge Secure Sandbox</span>
            </div>
          </div>
        </div>

        {/* Right Side: Code Context & Assistant Sidebar */}
        <AnimatePresence>
          {showContextPane && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                borderLeft: '1px solid var(--border)',
                background: 'var(--surface2)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Code2 size={16} color="var(--accent)" />
                <span>Active Context</span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Active Editor Code Snippet */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileCode2 size={13} />
                    Current Editor Code
                  </div>
                  {code.trim() ? (
                    <pre
                      className="mono"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 11.5,
                        lineHeight: 1.5,
                        maxHeight: 220,
                        overflow: 'auto',
                        color: 'var(--text)',
                        margin: 0
                      }}
                    >
                      {code.slice(0, 1000)}
                      {code.length > 1000 ? '\n... (truncated)' : ''}
                    </pre>
                  ) : (
                    <div style={{ padding: '14px', borderRadius: 8, background: 'var(--surface)', border: '1px dashed var(--border)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                      No code currently in editor. Upload or paste Python code in <b>New Analysis</b> to pass context.
                    </div>
                  )}
                </div>

                {/* Analysis Findings Summary */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={13} />
                    Scan Findings
                  </div>
                  {analysisContext ? (
                    <div
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        lineHeight: 1.55,
                        maxHeight: 180,
                        overflow: 'auto'
                      }}
                    >
                      {analysisContext}
                    </div>
                  ) : (
                    <div style={{ padding: '14px', borderRadius: 8, background: 'var(--surface)', border: '1px dashed var(--border)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                      Run a security scan to populate vulnerability findings.
                    </div>
                  )}
                </div>

                {/* Engine Info Box */}
                <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Assistant Engine</div>
                  <div>• Model: <b>Gemini 3.5 Flash</b></div>
                  <div>• Fallback: <b>Gemini 3.5 Flash Lite</b></div>
                  <div>• Context Window: <b>1,000,000 tokens</b></div>
                  <div>• Safe Subprocess Execution</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
