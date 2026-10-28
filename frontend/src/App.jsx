import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  FilePlus2,
  Bug,
  Sun,
  Moon,
  Hammer,
  History as HistoryIcon,
  Globe,
  LogIn,
  LogOut
} from 'lucide-react'
import Dashboard from './Dashboard'
import NewAnalysis from './NewAnalysis'
import Results from './Results'
import History from './History'
import LandingPage from './LandingPage'
import Auth from './Auth'

const NAV = [
  ['dash', 'Dashboard', LayoutDashboard],
  ['new', 'New analysis', FilePlus2],
  ['res', 'Results', Bug],
  ['history', 'History', HistoryIcon]
]

export default function App() {
  const [view, setView] = useState('app') // 'landing' | 'app' | 'auth'
  const [authMode, setAuthMode] = useState('login')
  const [page, setPage] = useState('dash')
  const [analysisId, setAnalysisId] = useState(null)
  const [historyCount, setHistoryCount] = useState(null)

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [theme, setTheme] = useState(() =>
    localStorage.getItem('cf-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('cf-theme', theme)
  }, [theme])

  const updateHistoryCount = () => {
    fetch('/api/analyses/')
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (Array.isArray(data)) setHistoryCount(data.length)
      })
      .catch(() => {})
  }

  useEffect(() => {
    updateHistoryCount()
  }, [page])

  const handleLogout = () => {
    localStorage.removeItem('cf_token')
    localStorage.removeItem('cf_user')
    setUser(null)
  }

  if (view === 'landing') {
    return (
      <LandingPage
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onLaunchApp={() => setView('app')}
        onOpenAuth={mode => {
          setAuthMode(mode)
          setView('auth')
        }}
        user={user}
      />
    )
  }

  if (view === 'auth') {
    return (
      <Auth
        initialMode={authMode}
        onSuccess={userData => {
          setUser(userData)
          setView('app')
        }}
        onBackToLanding={() => setView('landing')}
      />
    )
  }

  const pages = {
    dash: (
      <Dashboard
        onNew={() => setPage('new')}
        onSelect={id => { setAnalysisId(id); setPage('res') }}
        onGoToHistory={() => setPage('history')}
      />
    ),
    new: <NewAnalysis onDone={id => { setAnalysisId(id); setPage('res'); updateHistoryCount() }} />,
    res: <Results theme={theme} analysisId={analysisId} />,
    history: <History onSelect={id => { setAnalysisId(id); setPage('res') }} onNew={() => setPage('new')} />,
  }

  return (
    <div className="app">
      <aside className="side">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => setView('landing')} title="View Landing Page">
          <Hammer size={20} />
          <span>CodeForge</span>
        </div>
        <nav aria-label="Main">
          {NAV.map(([k, label, Icon]) => (
            <button key={k} className={'nav' + (page === k ? ' on' : '')} onClick={() => setPage(k)}
              aria-current={page === k ? 'page' : undefined} title={label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <Icon size={18} />
                <span>{label}</span>
              </div>
              {k === 'history' && historyCount !== null && historyCount > 0 && (
                <span className="nav-badge">{historyCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <button className="nav" onClick={() => setView('landing')} title="Visit landing page" style={{ marginBottom: 4 }}>
          <Globe size={18} color="var(--cyan)" />
          <span>Landing Page</span>
        </button>

        <button className="nav" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark or light theme" style={{ marginBottom: 6 }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        {user ? (
          <div className="user-widget" onClick={handleLogout} title="Click to Sign Out">
            <div className="user-avatar">
              {(user.name || user.username || 'U')[0].toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user.name || user.username}</div>
              <div className="user-role">{user.role || 'Developer'}</div>
            </div>
            <LogOut size={14} color="var(--text-dim)" />
          </div>
        ) : (
          <button
            className="btn sm pri"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
              setAuthMode('login')
              setView('auth')
            }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        )}
      </aside>

      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {pages[page]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
