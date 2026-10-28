import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History as HistoryIcon,
  Search,
  Trash2,
  FileCode2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Info,
  CheckCircle2,
  ExternalLink,
  Code2,
  RotateCcw,
  SlidersHorizontal,
  Check,
  X,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { SEV } from './data'

const STATUS_MAP = {
  COMPLETED: { label: 'Completed', color: 'ok' },
  RUNNING: { label: 'In Progress', color: 'med' },
  FAILED: { label: 'Failed', color: 'crit' },
  QUEUED: { label: 'Queued', color: 'info' }
}

export default function History({ onSelect, onNew }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sevFilter, setSevFilter] = useState('ALL')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [previewItem, setPreviewItem] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // null | { type: 'single', item } | { type: 'bulk' } | { type: 'clear' }
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const fetchHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analyses/')
      if (!res.ok) throw new Error('Failed to load analysis history.')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      setError(err.message || 'Could not connect to backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // Filter items
  const filtered = useMemo(() => {
    return items.filter(it => {
      const matchesSearch =
        it.filename.toLowerCase().includes(search.toLowerCase()) ||
        String(it.id).includes(search) ||
        (it.code_snippet && it.code_snippet.toLowerCase().includes(search.toLowerCase()))

      const matchesStatus = statusFilter === 'ALL' || it.status === statusFilter

      let matchesSev = true
      if (sevFilter === 'CLEAN') matchesSev = it.total_issues === 0
      else if (sevFilter === 'CRITICAL') matchesSev = (it.counts?.critical || 0) > 0
      else if (sevFilter === 'HIGH') matchesSev = (it.counts?.high || 0) > 0

      return matchesSearch && matchesStatus && matchesSev
    })
  }, [items, search, statusFilter, sevFilter])

  // Bulk selection handlers
  const toggleSelect = id => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)))
    }
  }

  // Delete single analysis
  const executeDeleteSingle = async item => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/analyses/${item.id}/`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete analysis.')
      setItems(prev => prev.filter(i => i.id !== item.id))
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
      showToast(`Deleted scan report for "${item.filename}"`)
    } catch (err) {
      alert(err.message || 'Error deleting item')
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  // Delete selected bulk
  const executeDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    setDeleting(true)
    try {
      const idsArray = Array.from(selectedIds)
      const res = await fetch('/api/analyses/clear/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray })
      })
      if (!res.ok) throw new Error('Bulk delete failed.')
      setItems(prev => prev.filter(i => !selectedIds.has(i.id)))
      showToast(`Successfully deleted ${selectedIds.size} scan reports`)
      setSelectedIds(new Set())
    } catch (err) {
      alert(err.message || 'Error deleting selected items')
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  // Clear all history
  const executeClearAll = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/analyses/clear/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      if (!res.ok) throw new Error('Clear all failed.')
      setItems([])
      setSelectedIds(new Set())
      showToast('All scan history cleared permanently.')
    } catch (err) {
      alert(err.message || 'Error clearing history')
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  // Metrics
  const totalScans = items.length
  const totalIssuesFound = items.reduce((acc, it) => acc + (it.total_issues || 0), 0)
  const cleanScans = items.filter(it => it.total_issues === 0 && it.status === 'COMPLETED').length

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 24,
              right: 32,
              zIndex: 110,
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              padding: '12px 18px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--text)'
            }}
          >
            <CheckCircle2 size={18} color="var(--accent)" />
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="dash-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Analysis Audit History</h1>
            <span className="badge" style={{ '--c': 'var(--accent)' }}>
              {totalScans} Reports
            </span>
          </div>
          <p className="sub">
            Complete historical audit trail of scanned Python files, detected vulnerabilities, and auto-fixes
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn" onClick={fetchHistory} title="Refresh records" disabled={loading}>
            <RotateCcw size={15} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          {items.length > 0 && (
            <button
              className="btn danger"
              onClick={() => setDeleteConfirm({ type: 'clear' })}
              title="Clear all history entries"
            >
              <Trash2 size={15} />
              Clear All History
            </button>
          )}
          <button className="btn pri" onClick={onNew}>
            <Sparkles size={15} />
            New Scan
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card" style={{ padding: '14px 18px' }}>
          <div className="kpi-top">
            <span>Total Historical Scans</span>
            <Layers size={16} />
          </div>
          <div className="kpi-val" style={{ fontSize: 26 }}>{totalScans}</div>
          <div className="kpi-footer">Persisted in SQLite Engine</div>
        </div>

        <div className="kpi-card" style={{ padding: '14px 18px' }}>
          <div className="kpi-top">
            <span>Total Flaws Identified</span>
            <AlertTriangle size={16} color="var(--high)" />
          </div>
          <div className="kpi-val" style={{ fontSize: 26 }}>{totalIssuesFound}</div>
          <div className="kpi-footer">Tri-engine security issues</div>
        </div>

        <div className="kpi-card" style={{ padding: '14px 18px' }}>
          <div className="kpi-top">
            <span>Clean Code Reports</span>
            <CheckCircle2 size={16} color="var(--ok)" />
          </div>
          <div className="kpi-val" style={{ fontSize: 26 }}>{cleanScans}</div>
          <div className="kpi-footer">
            {totalScans > 0 ? `${Math.round((cleanScans / totalScans) * 100)}% zero-vulnerability rate` : 'No runs'}
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Selection */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div className="history-toolbar">
          <div className="history-search-wrap">
            <Search size={16} className="history-search-icon" />
            <input
              type="text"
              placeholder="Search history by filename, scan ID, or code snippet..."
              className="history-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filters */}
          <div className="filter-group">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginRight: 2 }}>STATUS:</span>
            {['ALL', 'COMPLETED', 'RUNNING', 'FAILED'].map(st => (
              <button
                key={st}
                className={'filter-pill' + (statusFilter === st ? ' active' : '')}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'ALL' ? 'All' : st.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Severity Filters */}
          <div className="filter-group">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginRight: 2 }}>SEVERITY:</span>
            {[
              ['ALL', 'All'],
              ['CRITICAL', 'Has Critical'],
              ['HIGH', 'Has High'],
              ['CLEAN', 'Clean Only']
            ].map(([k, label]) => (
              <button
                key={k}
                className={'filter-pill' + (sevFilter === k ? ' active' : '')}
                onClick={() => setSevFilter(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Banner */}
        {selectedIds.size > 0 && (
          <div className="bulk-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600 }}>
              <CheckCircle2 size={17} color="var(--accent)" />
              <span>{selectedIds.size} analysis {selectedIds.size === 1 ? 'report' : 'reports'} selected</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn sm ghost" onClick={() => setSelectedIds(new Set())}>
                Deselect all
              </button>
              <button className="btn sm danger" onClick={() => setDeleteConfirm({ type: 'bulk' })}>
                <Trash2 size={14} />
                Delete Selected ({selectedIds.size})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main List Area */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <RotateCcw size={32} className="spin" style={{ color: 'var(--accent)', margin: '0 auto 14px' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading scan audit trail...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertTriangle size={32} color="var(--crit)" style={{ margin: '0 auto 10px' }} />
          <p className="err">{error}</p>
          <button className="btn sm" onClick={fetchHistory} style={{ marginTop: 12 }}>
            Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <HistoryIcon size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 16px', opacity: 0.6 }} />
          <h2>No matching history found</h2>
          <p className="sub" style={{ maxWidth: 440, margin: '6px auto 20px' }}>
            {search || statusFilter !== 'ALL' || sevFilter !== 'ALL'
              ? 'No historical reports matched your search filters. Try clearing your search parameters.'
              : 'You have not run any code security analyses yet. Upload or paste a Python file to create your first report.'}
          </p>
          {search || statusFilter !== 'ALL' || sevFilter !== 'ALL' ? (
            <button
              className="btn sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
                setSevFilter('ALL')
              }}
            >
              Reset Filters
            </button>
          ) : (
            <button className="btn pri" onClick={onNew}>
              Run First Analysis
            </button>
          )}
        </div>
      ) : (
        <div className="history-grid">
          {/* Header Row with Select All */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="history-checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
              />
              <span>Select all ({filtered.length})</span>
            </label>
            <span>Actions</span>
          </div>

          {filtered.map(item => {
            const st = STATUS_MAP[item.status] || { label: item.status, color: 'info' }
            const isSelected = selectedIds.has(item.id)
            const counts = item.counts || { critical: 0, high: 0, medium: 0, low: 0 }

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={'history-item' + (isSelected ? ' selected' : '')}
              >
                <div className="history-left">
                  <input
                    type="checkbox"
                    className="history-checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    aria-label={`Select analysis ${item.id}`}
                  />

                  <div className="history-file-icon">
                    <FileCode2 size={20} />
                  </div>

                  <div className="history-details">
                    <div className="history-filename">
                      <span className="mono" style={{ fontSize: 14 }}>{item.filename}</span>
                      <span className="badge" style={{ '--c': `var(--${st.color})` }}>
                        {st.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>
                        ID #{item.id}
                      </span>
                    </div>

                    <div className="history-meta">
                      <span>{item.created_formatted || item.created}</span>
                      <span>·</span>
                      <span>{item.lines_of_code || 0} lines</span>
                      <span>·</span>
                      <span style={{ fontWeight: 600, color: item.total_issues > 0 ? 'var(--text)' : 'var(--ok)' }}>
                        {item.total_issues} {item.total_issues === 1 ? 'finding' : 'findings'}
                      </span>

                      {/* Severity Mini Badges */}
                      {item.total_issues > 0 && (
                        <div style={{ display: 'inline-flex', gap: 4, marginLeft: 4 }}>
                          {counts.critical > 0 && (
                            <span className="badge" style={{ '--c': 'var(--crit)', fontSize: 10, padding: '1px 5px' }}>
                              {counts.critical} crit
                            </span>
                          )}
                          {counts.high > 0 && (
                            <span className="badge" style={{ '--c': 'var(--high)', fontSize: 10, padding: '1px 5px' }}>
                              {counts.high} high
                            </span>
                          )}
                          {counts.medium > 0 && (
                            <span className="badge" style={{ '--c': 'var(--med)', fontSize: 10, padding: '1px 5px' }}>
                              {counts.medium} med
                            </span>
                          )}
                          {counts.low > 0 && (
                            <span className="badge" style={{ '--c': 'var(--low)', fontSize: 10, padding: '1px 5px' }}>
                              {counts.low} low
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="history-right">
                  {/* Quick Code Preview */}
                  {item.code_snippet && (
                    <button
                      className="btn sm ghost"
                      title="Preview snippet"
                      onClick={() => setPreviewItem(item)}
                    >
                      <Code2 size={15} />
                      <span style={{ display: 'none' }}>Preview</span>
                    </button>
                  )}

                  {/* Open in Results */}
                  <button
                    className="btn sm"
                    onClick={() => onSelect && onSelect(item.id)}
                    title="Open full interactive results"
                  >
                    <ExternalLink size={14} />
                    View Results
                  </button>

                  {/* Single Delete Button */}
                  <button
                    className="btn sm danger"
                    onClick={() => setDeleteConfirm({ type: 'single', item })}
                    title="Delete this analysis report"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Code Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div className="modal-overlay" onClick={() => setPreviewItem(null)}>
            <div className="modal-card" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCode2 size={18} color="var(--accent)" />
                    {previewItem.filename}
                  </h2>
                  <p className="sub" style={{ margin: '2px 0 0', fontSize: 12 }}>
                    Report ID #{previewItem.id} · Created {previewItem.created_formatted}
                  </p>
                </div>
                <button className="btn sm ghost" onClick={() => setPreviewItem(null)}>
                  <X size={18} />
                </button>
              </div>

              <div
                className="mono"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 12.5,
                  maxHeight: 340,
                  overflow: 'auto',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {previewItem.code_snippet || 'No source snippet saved.'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button className="btn" onClick={() => setPreviewItem(null)}>
                  Close
                </button>
                <button
                  className="btn pri"
                  onClick={() => {
                    const id = previewItem.id
                    setPreviewItem(null)
                    onSelect && onSelect(id)
                  }}
                >
                  Open in Workspace Editor
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modals for Delete */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
            <div className="modal-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--crit-soft)',
                    color: 'var(--crit)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h2>
                    {deleteConfirm.type === 'single'
                      ? 'Delete Analysis Report?'
                      : deleteConfirm.type === 'bulk'
                      ? `Delete ${selectedIds.size} Reports?`
                      : 'Clear Entire Scan History?'}
                  </h2>
                  <p className="sub" style={{ margin: '6px 0 0', fontSize: 13 }}>
                    {deleteConfirm.type === 'single'
                      ? `Are you sure you want to permanently delete the audit record for "${deleteConfirm.item.filename}" (ID: ${deleteConfirm.item.id})? This cannot be undone.`
                      : deleteConfirm.type === 'bulk'
                      ? `Are you sure you want to delete ${selectedIds.size} selected audit reports? All findings and diffs will be removed.`
                      : 'This will permanently wipe all analysis history and audit logs from your database. Proceed with caution.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  className="btn"
                  disabled={deleting}
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn danger"
                  disabled={deleting}
                  onClick={() => {
                    if (deleteConfirm.type === 'single') executeDeleteSingle(deleteConfirm.item)
                    else if (deleteConfirm.type === 'bulk') executeDeleteSelected()
                    else executeClearAll()
                  }}
                >
                  {deleting ? (
                    <RotateCcw size={14} className="spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
