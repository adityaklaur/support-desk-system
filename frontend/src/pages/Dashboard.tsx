import { useCallback, useEffect, useState } from 'react'
import { api, readableError } from '../services/api'
import type { DashboardStats } from '../types'
import Icon from '../components/Icon'
import LoadingSpinner from '../components/LoadingSpinner'

const metrics: { key: keyof DashboardStats; label: string; className: string }[] = [
  { key: 'total', label: 'Total tickets', className: 'metric-blue' },
  { key: 'open', label: 'Open', className: 'metric-sky' },
  { key: 'in_progress', label: 'In progress', className: 'metric-violet' },
  { key: 'waiting_on_customer', label: 'Waiting on customer', className: 'metric-amber' },
  { key: 'resolved', label: 'Resolved', className: 'metric-green' },
  { key: 'urgent', label: 'Urgent priority', className: 'metric-red' },
  { key: 'overdue', label: 'Overdue', className: 'metric-red' },
]

export default function Dashboard({ onNew, onTickets }: { onNew: () => void; onTickets: () => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setStats(await api.dashboard()) }
    catch (cause) { setError(readableError(cause)) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">OVERVIEW</p>
      <h1>Support dashboard</h1><p>Monitor the entire ticket lifecycle in one place.</p></div>
      <div className="heading-actions"><button className="btn btn-outline" onClick={() => void refresh()}>
        <Icon name="refresh" size={17}/> Refresh</button>
        <button className="btn btn-primary" onClick={onNew}><Icon name="plus" size={17}/> New ticket</button></div></div>
    {error && <div className="alert alert-error" role="alert">{error} <button className="link-button" onClick={() => void refresh()}>Retry</button></div>}
    {loading && !stats ? <LoadingSpinner label="Loading dashboard…"/> : stats && <>
      <div className="metrics-grid">{metrics.map(m => <article className={`metric-card ${m.className}`} key={m.key}>
        <div className="metric-label">{m.label}</div><div className="metric-value">{stats[m.key]}</div>
        <div className="metric-caption">{m.key === 'overdue' ? 'Unresolved for more than 24 hours' : 'Current ticket count'}</div>
      </article>)}</div>
      <section className="panel overview-panel"><div><h2>Ready to manage support?</h2>
        <p>Create a ticket, assign it to an agent, add public replies or internal notes, and review every change in activity history.</p></div>
        <button className="btn btn-outline" onClick={onTickets}>View ticket queue <Icon name="arrow-right" size={17}/></button></section>
    </>}
  </div>
}
