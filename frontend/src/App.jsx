import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  FilePlus2,
  Sun,
  Moon,
  Hammer,
  History as HistoryIcon,
  Globe,
  LogIn,
  LogOut,
  User as UserIcon,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import LandingPage from './LandingPage'
import Auth from './Auth'
import Dashboard from './Dashboard'
import NewAnalysis from './NewAnalysis'
import Results from './Results'
import History from './History'
import Chatbot from './Chatbot'
import ChatPage from './ChatPage'

// Nav items inside the workspace: Dashboard -> New Analysis -> History -> AI Chatbot
const NAV = [
  ['dash', 'Dashboard', LayoutDashboard],
  ['new', 'New Analysis', FilePlus2],
  ['history', 'History', HistoryIcon],
  ['chat', 'AI Chatbot', MessageSquare],
]

export default function App() {
  // Check if user is already authenticated
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cf_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Start on landing page (or dashboard if already logged in)
  const [page, setPage] = useState(() => {
    return localStorage.getItem('cf_user') ? 'dash' : 'landing'
  })
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup'

  const [analysisId, setAnalysisId] = useState(null)
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('cf-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))

  // Code context passed to chatbot from the editor page
  const [editorCode, setEditorCode] = useState('')
  // Analysis summary context for chatbot (populated when results load)
  const [analysisContext, setAnalysisContext] = useState('')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('cf-theme', theme)
  }, [theme])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setPage('dash')
  }

  const handleLogout = () => {
    localStorage.removeItem('cf_token')
    localStorage.removeItem('cf_user')
    setUser(null)
    setPage('landing')
  }

  const handleAnalysisDone = (id) => {
    setAnalysisId(id)
    setPage('res')
    // Fetch issue summary to give chatbot context
    fetch(`/api/analyses/${id}/issues/`)
      .then(r => r.json())
      .then(data => {
        const issues = Array.isArray(data) ? data : (data.issues || [])
        if (issues.length > 0) {
          const summary = issues.slice(0, 10).map(i =>
            `[${i.severity?.toUpperCase() || 'INFO'}] Line ${i.line_start}: ${i.title} (${i.rule_id || ''})`
          ).join('\n')
          setAnalysisContext(`Analysis found ${issues.length} issue(s):\n${summary}`)
        } else {
          setAnalysisContext('Analysis completed with no issues found.')
        }
      })
      .catch(() => {})
  }

  // ── 1. Full-screen Landing Page ──────────────────────────────────────────
  if (page === 'landing') {
    return (
      <>
        <LandingPage
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          onLaunchApp={() => setPage(user ? 'dash' : 'auth')}
          onOpenAuth={(mode) => {
            setAuthMode(mode || 'login')
            setPage('auth')
          }}
          user={user}
        />
        <Chatbot code={editorCode} analysisContext={analysisContext} />
      </>
    )
  }

  // ── 2. Full-screen Auth (Login / Sign Up) Page ───────────────────────────
  if (page === 'auth') {
    return (
      <>
        <Auth
          initialMode={authMode}
          onSuccess={handleLoginSuccess}
          onBackToLanding={() => setPage('landing')}
        />
        <Chatbot code={editorCode} analysisContext={analysisContext} />
      </>
    )
  }

  // ── 3. Workspace Pages ───────────────────────────────────────────────────
  const pages = {
    dash: (
      <Dashboard
        key={user ? user.id : 'guest'}
        onNew={() => setPage('new')}
        onSelect={id => { setAnalysisId(id); setPage('res') }}
        onGoToHistory={() => setPage('history')}
      />
    ),
    new: (
      <NewAnalysis
        key={user ? user.id : 'guest'}
        theme={theme}
        onDone={handleAnalysisDone}
        onCodeChange={setEditorCode}
      />
    ),
    res: <Results theme={theme} analysisId={analysisId} />,
    history: <History key={user ? user.id : 'guest'} onSelect={id => { setAnalysisId(id); setPage('res') }} />,
    chat: <ChatPage code={editorCode} analysisContext={analysisContext} />,
  }

  // Full-height zero-padding layout for editor and big-window chatbot
  const isFullHeightPage = page === 'new' || page === 'chat'

  return (
    <div className="app" style={isFullHeightPage ? { height: '100vh', overflow: 'hidden' } : {}}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="side">
        {/* Brand */}
        <div
          className="brand"
          style={{ cursor: 'pointer' }}
          onClick={() => setPage('landing')}
          title="Go to Landing Page"
        >
          <Hammer size={20} />
          <span>CodeForge</span>
        </div>

        {/* Workspace Navigation */}
        <nav aria-label="Main">
          {NAV.map(([k, label, Icon]) => (
            <button
              key={k}
              className={'nav' + (page === k ? ' on' : '')}
              onClick={() => setPage(k)}
              aria-current={page === k ? 'page' : undefined}
              title={label}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Landing Page link */}
        <button
          className="nav"
          onClick={() => setPage('landing')}
          title="Return to Landing Page"
        >
          <Globe size={18} />
          <span>Landing Page</span>
        </button>

        {/* Theme toggle */}
        <button
          className="nav"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark or light theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        {/* User Profile / Auth Area */}
        <div
          style={{
            marginTop: 8,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
          }}
        >
          {user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 8px',
                borderRadius: 8,
                background: 'var(--surface2)',
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.username}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {(user.name || user.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.name || user.username}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.role || 'Pro Developer'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  padding: 4,
                  borderRadius: 4,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--crit)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn sm pri"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setAuthMode('login')
                setPage('auth')
              }}
            >
              <LogIn size={15} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Workspace Body ───────────────────────────────────────────── */}
      <main
        className={isFullHeightPage ? '' : 'main'}
        style={isFullHeightPage
          ? { display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }
          : {}}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={isFullHeightPage ? { display: 'flex', flexDirection: 'column', height: '100%' } : {}}
          >
            {pages[page]}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating chatbot (hidden when already on full chat page) */}
      {page !== 'chat' && (
        <Chatbot
          code={editorCode}
          analysisContext={analysisContext}
          onExpand={() => setPage('chat')}
        />
      )}
    </div>
  )
}
