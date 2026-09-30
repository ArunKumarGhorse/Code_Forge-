import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, FilePlus2, Bug, Sun, Moon, Hammer } from 'lucide-react'
import Dashboard from './Dashboard'
import NewAnalysis from './NewAnalysis'
import Results from './Results'

const NAV = [['dash', 'Dashboard', LayoutDashboard], ['new', 'New analysis', FilePlus2], ['res', 'Results', Bug]]

export default function App() {
  const [page, setPage] = useState('dash')
  const [analysisId, setAnalysisId] = useState(null)
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('cf-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('cf-theme', theme)
  }, [theme])
  
  const pages = {
  dash: <Dashboard onNew={() => setPage('new')} />,
  new: <NewAnalysis onDone={id => { setAnalysisId(id); setPage('res') }} />,
  res: <Results theme={theme} analysisId={analysisId} />,
}


  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><Hammer size={20} /><span>CodeForge</span></div>
        <nav aria-label="Main">
          {NAV.map(([k, label, Icon]) => (
            <button key={k} className={'nav' + (page === k ? ' on' : '')} onClick={() => setPage(k)}
              aria-current={page === k ? 'page' : undefined} title={label}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <button className="nav" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark or light theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
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
