import { motion } from 'framer-motion'
import { ShieldAlert, Flame, AlertTriangle, Info, Layers, Github, FileArchive, Plus } from 'lucide-react'
import { ISSUES, ORDER, SEV, RECENT } from './data'

const ICON = { critical: Flame, high: ShieldAlert, medium: AlertTriangle, low: Info }
const STATUS = { COMPLETED: 'ok', RUNNING: 'med', FAILED: 'crit' }

export default function Dashboard({ onNew }) {
  // MOCK: replace with GET /api/dashboard/
  const counts = Object.fromEntries(ORDER.map(s => [s, ISSUES.filter(i => i.severity === s).length]))
  const total = ISSUES.length

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div><h1>Dashboard</h1><p className="sub">Issues found in your latest analysis</p></div>
        <button className="btn pri" onClick={onNew}><Plus size={16} />New analysis</button>
      </div>

      <div className="grid5">
        <div className="card stat"><span><Layers size={15} />Total issues</span><b>{total}</b></div>
        {ORDER.map(s => {
          const Icon = ICON[s]
          return (
            <div key={s} className="card stat" style={{ '--c': `var(--${SEV[s]})` }}>
              <span><Icon size={15} color="var(--c)" />{s[0].toUpperCase() + s.slice(1)}</span><b>{counts[s]}</b>
            </div>
          )
        })}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h2>Severity breakdown</h2>
        <div className="bar" role="img" aria-label="Issues by severity">
          {ORDER.map((s, i) => (
            <motion.div key={s} style={{ background: `var(--${SEV[s]})` }}
              initial={{ width: 0 }} animate={{ width: `${(counts[s] / total) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: 'easeOut' }} />
          ))}
        </div>
        <div className="legend">
          {ORDER.map(s => <span key={s} style={{ '--c': `var(--${SEV[s]})` }}><i className="dot" />{s} · {counts[s]}</span>)}
        </div>
      </div>

      <div className="card">
        <h2>Recent analyses</h2>
        <table>
          <thead><tr><th>Project</th><th>Source</th><th>Languages</th><th>Issues</th><th>Status</th><th>When</th></tr></thead>
          <tbody>
            {RECENT.map(r => (
              <tr key={r.project}>
                <td className="mono">{r.project}</td>
                <td><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  {r.source === 'GitHub' ? <Github size={14} /> : <FileArchive size={14} />}{r.source}</span></td>
                <td>{r.langs}</td><td>{r.issues}</td>
                <td><span className="badge" style={{ '--c': `var(--${STATUS[r.status]})` }}>{r.status.toLowerCase()}</span></td>
                <td style={{ color: 'var(--muted)' }}>{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
