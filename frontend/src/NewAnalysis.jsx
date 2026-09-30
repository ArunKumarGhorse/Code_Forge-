import { useEffect, useRef, useState } from 'react'
import { Upload, Github, ClipboardPaste, Loader2, CheckCircle2, Circle, Play } from 'lucide-react'
import { STAGES } from './data'

const TABS = [['zip', 'Upload file or ZIP', Upload], ['git', 'GitHub link', Github], ['paste', 'Paste code', ClipboardPaste]]
const GH = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/

export default function NewAnalysis({ onDone }) {
  const [tab, setTab] = useState('paste')
  const [over, setOver] = useState(false)
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState(-1) // -1 = not started
  const [id, setId] = useState(null)
  const [error, setError] = useState('')
  const fi = useRef(null)

  const urlBad = url && !GH.test(url)
  const ready = (tab === 'zip' && file) || (tab === 'git' && GH.test(url)) || (tab === 'paste' && code.trim())
  const running = stage >= 0

  const start = async () => {
    setError('')
    if (tab !== 'paste') { setError('ZIP and GitHub are coming soon. Use "Paste code" for now.'); return }
    try {
      const res = await fetch('/api/analyses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, filename: 'pasted.py' }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setId(data.id)
      setStage(data.stage)
    } catch {
      setError('Could not start the analysis. Check that the backend is running.')
    }
  }

  // Progress backend se aata hai (fake nahi): har 1 second status poll hota hai
  useEffect(() => {
    if (!id) return
    const t = setInterval(async () => {
      try {
        const d = await (await fetch(`/api/analyses/${id}/`)).json()
        setStage(d.stage)
        if (d.status === 'COMPLETED') { clearInterval(t); setTimeout(() => onDone(id), 500) }
        if (d.status === 'FAILED') {
          clearInterval(t); setStage(-1); setId(null)
          setError('Analysis failed. Check your code and try again.')
        }
      } catch { /* agli poll pe dobara try hoga */ }
    }, 1000)
    return () => clearInterval(t)
  }, [id])

  return (
    <>
      <h1>New analysis</h1>
      <p className="sub">Choose where your code comes from</p>

      {!running ? (
        <div className="card" style={{ maxWidth: 720 }}>
          <div className="tabs" role="tablist">
            {TABS.map(([k, label, Icon]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>

          {tab === 'zip' && (
            <div className={'drop' + (over ? ' over' : '')} role="button" tabIndex={0}
              onClick={() => fi.current.click()} onKeyDown={e => e.key === 'Enter' && fi.current.click()}
              onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
              onDrop={e => { e.preventDefault(); setOver(false); setFile(e.dataTransfer.files[0]) }}>
              <Upload size={28} />
              <div>{file ? <b className="mono">{file.name}</b> : 'Drop a source file or ZIP here, or click to browse'}</div>
              <input ref={fi} type="file" hidden onChange={e => setFile(e.target.files[0])} />
            </div>
          )}
          {tab === 'git' && (
            <>
              <label htmlFor="repo">Public repository URL</label>
              <input id="repo" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://github.com/owner/repo" />
              {urlBad && <p className="err">Enter a link like https://github.com/owner/repo</p>}
            </>
          )}
          {tab === 'paste' && (
            <>
              <label htmlFor="code">Python code</label>
              <textarea id="code" value={code} onChange={e => setCode(e.target.value)} placeholder="Paste your code here" />
            </>
          )}

          <div className="actions">
            <button className="btn pri" disabled={!ready} onClick={start}><Play size={16} />Start analysis</button>
          </div>
          {error && <p className="err">{error}</p>}
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 420 }}>
          <h2>Analysis in progress</h2>
          <ul className="steps" aria-live="polite">
            {STAGES.map((s, i) => (
              <li key={s} className={'step' + (i < stage ? ' done' : '')}>
                {i < stage ? <CheckCircle2 size={18} /> : i === stage ? <Loader2 size={18} className="spin" /> : <Circle size={18} />}
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}