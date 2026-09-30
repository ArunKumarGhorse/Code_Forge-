import { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Search, Wand2, Check, X, EyeOff, Cpu, Wrench, FileCode2, Loader2 } from 'lucide-react'
import { ORDER, SEV } from './data'

const MARK = { high: 8, medium: 4, low: 2 } // Monaco: 8 error, 4 warning, 2 info
const VAL = { validated: ['Validated', 'ok'], failed: ['Validation failed', 'crit'], incomplete: ['Validation incomplete', 'med'] }

export default function Results({ theme, analysisId }) {
  const [data, setData] = useState(null)
  const [sel, setSel] = useState(null)
  const [sev, setSev] = useState('all')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState({})
  const [error, setError] = useState('')
  const ed = useRef(null)
  const deco = useRef(null)

  useEffect(() => {
    if (!analysisId) return
    fetch(`/api/analyses/${analysisId}/issues/`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setSel(d.issues[0] || null) })
      .catch(() => setError('Could not load results. Is the Django server running?'))
  }, [analysisId])

  const list = useMemo(() => (data?.issues || []).filter(i =>
    (sev === 'all' || i.severity === sev) && (i.title + i.rule).toLowerCase().includes(q.toLowerCase())), [data, sev, q])

  const focus = i => {
    if (!ed.current || !i) return
    const { editor, monaco } = ed.current
    editor.revealLineInCenter(i.line)
    deco.current.set([{ range: new monaco.Range(i.line, 1, i.line, 1), options: { isWholeLine: true, className: 'cf-line' } }])
  }
  const onMount = (editor, monaco) => {
    ed.current = { editor, monaco }
    deco.current = editor.createDecorationsCollection([])
    monaco.editor.setModelMarkers(editor.getModel(), 'codeforge', data.issues.map(i => ({
      startLineNumber: i.line, endLineNumber: i.line, startColumn: 1, endColumn: 200,
      message: `${i.title} (${i.rule})`, severity: MARK[i.severity] || 2,
    })))
    focus(sel)
  }
  useEffect(() => focus(sel), [sel])

  if (!analysisId) return <><h1>Results</h1><p className="sub">Run a new analysis to see results here.</p></>
  if (error) return <p className="err">{error}</p>
  if (!data) return <Loader2 className="spin" />

  const st = sel && status[sel.id]
  const mark = v => setStatus(s => ({ ...s, [sel.id]: v }))
  const v = sel && VAL[sel.validation]

  return (
    <>
      <h1>Results</h1>
      <p className="sub mono" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <FileCode2 size={15} />{data.filename} · {data.issues.length} issues
      </p>
      <div className="split">
        <section className="left" aria-label="Issues">
          <div className="search"><Search size={15} />
            <input aria-label="Search issues" placeholder="Search issue or rule" value={q} onChange={e => setQ(e.target.value)} /></div>
          <div className="chips">
            {['all', ...ORDER].map(s => (
              <button key={s} className={'chip' + (sev === s ? ' on' : '')} onClick={() => setSev(s)}>{s}</button>
            ))}
          </div>
          <div className="list">
            {list.length === 0 && <p className="sub">No issues match these filters.</p>}
            {list.map(i => (
              <button key={i.id} className={'row' + (sel?.id === i.id ? ' on' : '')}
                style={{ '--c': `var(--${SEV[i.severity]})` }} onClick={() => setSel(i)}>
                <b>{i.title}</b>
                <small className="mono">line {i.line} · {i.rule}{status[i.id] ? ` · ${status[i.id]}` : ''}</small>
              </button>
            ))}
          </div>
        </section>

        <div className="right">
          <div className="editor">
            <Editor language="python" value={data.code} theme={theme === 'dark' ? 'vs-dark' : 'light'} onMount={onMount}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, fontFamily: 'IBM Plex Mono, monospace', scrollBeyondLastLine: false }} />
          </div>
          <div className="card detail">
            {!sel ? <p className="sub">No issues found in this code.</p> : (
              <>
                <h2 style={{ fontSize: 16 }}>{sel.title}</h2>
                <div className="meta">
                  <span className="badge" style={{ '--c': `var(--${SEV[sel.severity]})` }}>{sel.severity}</span>
                  <span>Confidence {Math.round(sel.confidence * 100)}%</span>
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {sel.source.startsWith('ML') ? <Cpu size={14} /> : <Wrench size={14} />}{sel.source}</span>
                  <span className="mono">line {sel.line}</span>
                  {st && <span className="badge" style={{ '--c': 'var(--accent)' }}>{st}</span>}
                </div>
                {sel.what && <div className="sec"><h2>What is wrong</h2><p>{sel.what}</p></div>}
                {sel.why && <div className="sec"><h2>Why it matters</h2><p>{sel.why}</p></div>}
                {sel.how && <div className="sec"><h2>How to fix it</h2><p>{sel.how}</p></div>}
                {sel.fix_diff && (
                  <div className="sec">
                    <h2>Suggested fix</h2>
                    <div className="diff mono">
                      {sel.fix_diff.split('\n').map((l, n) => <div key={n} className={l[0] === '+' ? 'a' : 'd'}>{l}</div>)}
                    </div>
                    {v && <div className="checks"><span className="badge" style={{ '--c': `var(--${v[1]})` }}>{v[0]}</span></div>}
                  </div>
                )}
                <div className="actions">
                  <button className="btn" disabled title="Available after the AI step"><Wand2 size={16} />Generate fix</button>
                  <button className="btn pri" disabled={sel.validation !== 'validated' || !!st} onClick={() => mark('applied')}><Check size={16} />Apply fix</button>
                  <button className="btn" disabled={!sel.fix_diff || !!st} onClick={() => mark('rejected')}><X size={16} />Reject</button>
                  <button className="btn" disabled={!!st} onClick={() => mark('ignored')}><EyeOff size={16} />Ignore</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}