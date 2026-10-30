import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  Trash2,
  ChevronDown,
  Sparkles,
  Code2,
  Maximize2,
} from 'lucide-react'

const WELCOME = {
  role: 'assistant',
  content:
    "Hi! I'm **CodeForge Assistant** 👋\n\nI can help you with:\n- Understanding security issues in your code\n- Python best practices & fixes\n- Explaining analysis results\n- General programming questions\n\nWhat would you like to know?",
  id: 'welcome',
}

const SUGGESTIONS = [
  'Explain SQL injection risks',
  'What is Bandit SAST?',
  'How do I fix hardcoded secrets?',
  'What are CWE vulnerabilities?',
]

// Very minimal markdown renderer (bold, code, bullets, code blocks)
function Markdown({ text }) {
  if (!text) return null

  // Split into code blocks and normal text
  const parts = text.split(/(```[\s\S]*?```)/g)

  return (
    <div style={{ lineHeight: 1.65, fontSize: 13 }}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const inner = part.replace(/^```[a-z]*\n?/, '').replace(/```$/, '')
          return (
            <pre key={i} className="mono" style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '8px 12px', fontSize: 11.5,
              lineHeight: 1.55, overflowX: 'auto', margin: '6px 0', whiteSpace: 'pre-wrap'
            }}>
              {inner}
            </pre>
          )
        }

        // Process inline: bold (**text**), inline code (`text`), bullet lines
        const lines = part.split('\n')
        return (
          <div key={i}>
            {lines.map((line, j) => {
              const isBullet = /^[-•*]\s/.test(line.trim())
              const content = line.replace(/^[-•*]\s/, '')

              const inline = content.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((seg, k) => {
                if (seg.startsWith('`') && seg.endsWith('`')) {
                  return (
                    <code key={k} className="mono" style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 4, padding: '1px 5px', fontSize: 11.5, color: 'var(--accent)'
                    }}>{seg.slice(1, -1)}</code>
                  )
                }
                if (seg.startsWith('**') && seg.endsWith('**')) {
                  return <strong key={k}>{seg.slice(2, -2)}</strong>
                }
                return seg
              })

              if (isBullet) {
                return (
                  <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>•</span>
                    <span>{inline}</span>
                  </div>
                )
              }
              return line ? <p key={j} style={{ margin: '4px 0' }}>{inline}</p> : <br key={j} />
            })}
          </div>
        )
      })}
    </div>
  )
}

export default function Chatbot({ code = '', analysisContext = '', onExpand }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const [unread, setUnread] = useState(0)

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setUnread(0)
    }
  }, [messages, open])

  // Count new assistant messages while closed
  useEffect(() => {
    if (!open && messages.length > 1) {
      const last = messages[messages.length - 1]
      if (last.role === 'assistant' && last.id !== 'welcome') {
        setUnread(u => u + 1)
      }
    }
  }, [messages])

  const openChat = () => {
    setOpen(true)
    setUnread(0)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setError('')

    const userMsg = { role: 'user', content: msg, id: Date.now() }
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
          context: analysisContext || '',
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || `Server returned ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      if (!data.reply) {
        throw new Error('No reply received from AI.')
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, id: Date.now() + 1 }])
    } catch (err) {
      const errMsg = err.message || 'Could not reach AI. Check that the backend is running.'
      setError(errMsg)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error:** ${errMsg}\n\nPlease try again or verify your connection.`,
          id: Date.now() + 1,
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([WELCOME])
    setError('')
    setInput('')
  }

  return (
    <>
      {/* ── Floating Bubble ─────────────────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            onClick={openChat}
            aria-label="Open AI Chatbot"
            style={{
              position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
              width: 54, height: 54, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.32)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)' }}
          >
            <MessageSquare size={22} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 17, height: 17, borderRadius: '50%',
                background: 'var(--crit)', color: '#fff',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--surface)',
              }}>{unread}</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
              width: 380, height: 560,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 18, boxShadow: '0 12px 48px rgba(0,0,0,0.28)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', background: 'var(--accent)',
              color: '#fff', flexShrink: 0,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={17} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>CodeForge Assistant</div>
                <div style={{ fontSize: 11, opacity: 0.82, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  Powered by Gemini AI
                </div>
              </div>
              <div style={{ flex: 1 }} />
              {code && (
                <span title="Has code context" style={{ opacity: 0.75 }}>
                  <Code2 size={15} />
                </span>
              )}
              {onExpand && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onExpand()
                  }}
                  title="Open in Full Window"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', opacity: 0.75, display: 'flex', padding: 4 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.75'}
                >
                  <Maximize2 size={15} />
                </button>
              )}
              <button
                type="button" onClick={clearChat}
                title="Clear chat"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', opacity: 0.75, display: 'flex', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.75'}
              >
                <Trash2 size={15} />
              </button>
              <button
                type="button" onClick={() => setOpen(false)}
                title="Minimize"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', opacity: 0.75, display: 'flex', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.75'}
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(m => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start', gap: 8,
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: m.role === 'user' ? 'var(--accent-soft)' : 'var(--surface2)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: m.role === 'user' ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    maxWidth: '80%',
                    padding: '9px 13px',
                    borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    background: m.role === 'user' ? 'var(--accent)' : m.isError ? 'var(--crit-soft)' : 'var(--surface2)',
                    color: m.role === 'user' ? '#fff' : m.isError ? 'var(--crit)' : 'var(--text)',
                    border: m.role === 'user' ? 'none' : m.isError ? '1px solid var(--crit)' : '1px solid var(--border)',
                    fontSize: 13,
                  }}>
                    {m.role === 'user'
                      ? <span style={{ lineHeight: 1.55 }}>{m.content}</span>
                      : <Markdown text={m.content} />}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}>
                    <Bot size={14} />
                  </div>
                  <div style={{
                    padding: '10px 16px', borderRadius: '4px 14px 14px 14px',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--accent)', display: 'inline-block',
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: 'var(--crit-soft)', border: '1px solid var(--crit)',
                  color: 'var(--crit)', fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ flex: 1 }}>{error}</span>
                  <button type="button" onClick={() => setError('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
                    <X size={13} />
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions (only when 1 message) */}
            {messages.length === 1 && !loading && (
              <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => send(s)}
                    style={{
                      fontSize: 11.5, padding: '5px 10px', borderRadius: 20,
                      background: 'var(--accent-soft)', color: 'var(--accent)',
                      border: '1px solid var(--accent)', cursor: 'pointer',
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <Sparkles size={10} />{s}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div style={{
              padding: '10px 12px', borderTop: '1px solid var(--border)',
              background: 'var(--surface2)', flexShrink: 0,
            }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 8,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '6px 8px 6px 12px',
                transition: 'border-color 0.15s',
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
                  placeholder="Ask about your code or security issues…"
                  disabled={loading}
                  rows={1}
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    resize: 'none', outline: 'none', fontSize: 13,
                    color: 'var(--text)', lineHeight: 1.5, maxHeight: 96,
                    overflowY: 'auto', padding: 0, fontFamily: 'inherit',
                  }}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface2)',
                    color: input.trim() && !loading ? '#fff' : 'var(--text-dim)',
                    border: '1px solid var(--border)', cursor: input.trim() && !loading ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  {loading ? <RotateCcw size={14} className="spin" /> : <Send size={14} />}
                </button>
              </div>
              <p style={{ fontSize: 10.5, color: 'var(--text-dim)', margin: '5px 0 0', textAlign: 'center' }}>
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bounce animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  )
}

