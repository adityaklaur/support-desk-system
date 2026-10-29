import { useCallback, useEffect, useState } from 'react'
import { api, readableError } from '../services/api'
import type { SortBy, Ticket, TicketFilters, TicketPriority, TicketStatus } from '../types'
import Icon from '../components/Icon'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/format'

export default function Tickets({ onOpen, onNew }: { onOpen: (id: number) => void; onNew: () => void }) {
  const [filters, setFilters] = useState<TicketFilters>({ sort_by: 'updated' })
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const refresh = useCallback(() => setReload(n => n + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.listTickets(filters)
      .then(result => { if (active) setTickets(result) })
      .catch(cause => { if (active) setError(readableError(cause)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filters, reload])

  function setFilter<K extends keyof TicketFilters>(key: K, value: TicketFilters[K]) {
    setFilters(current => ({ ...current, [key]: value }))
  }

  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">WORKSPACE</p><h1>Ticket queue</h1>
      <p>Search, triage and track support requests.</p></div>
      <div className="heading-actions"><button className="btn btn-outline" onClick={refresh}>
        <Icon name="refresh" size={17}/> Refresh</button>
        <button className="btn btn-primary" onClick={onNew}><Icon name="plus" size={17}/> New ticket</button></div></div>
    <section className="panel filters-panel"><div className="filters-heading"><Icon name="filter" size={17}/><h2>Filters</h2></div>
      <div className="filters-grid">
        <div className="field filter-search"><label htmlFor="search">Search by subject or customer</label>
          <input id="search" placeholder="Search tickets…" value={filters.search || ''}
            onChange={e => setFilter('search', e.target.value)}/></div>
        <div className="field"><label htmlFor="status-filter">Status</label>
          <select id="status-filter" value={filters.status || ''} onChange={e => setFilter('status', e.target.value as TicketStatus | '')}>
            <option value="">All statuses</option>{(['Open', 'In Progress', 'Waiting on Customer', 'Resolved'] as TicketStatus[])
              .map(x => <option value={x} key={x}>{x}</option>)}</select></div>
        <div className="field"><label htmlFor="priority-filter">Priority</label>
          <select id="priority-filter" value={filters.priority || ''} onChange={e => setFilter('priority', e.target.value as TicketPriority | '')}>
            <option value="">All priorities</option>{(['Low', 'Medium', 'High', 'Urgent'] as TicketPriority[])
              .map(x => <option value={x} key={x}>{x}</option>)}</select></div>
        <div className="field"><label htmlFor="assignee-filter">Assignee</label>
          <input id="assignee-filter" placeholder="Agent name" value={filters.assignee || ''}
            onChange={e => setFilter('assignee', e.target.value)}/></div>
        <div className="field"><label htmlFor="sort-filter">Sort</label>
          <select id="sort-filter" value={filters.sort_by || 'updated'}
            onChange={e => setFilter('sort_by', e.target.value as SortBy)}>
            <option value="updated">Recently updated</option><option value="priority">Highest priority</option></select></div>
      </div>
      <div className="filter-footer"><button className="link-button" onClick={() => setFilters({ sort_by: 'updated' })}>Clear all filters</button></div>
    </section>
    {error && <div className="alert alert-error" role="alert">{error} <button className="link-button" onClick={refresh}>Retry</button></div>}
    {loading ? <LoadingSpinner label="Loading tickets…"/> : !error && <section className="panel queue-panel">
      <div className="panel-header"><div><h2>All tickets</h2><p>{tickets.length} matching {tickets.length === 1 ? 'ticket' : 'tickets'}</p></div></div>
      {tickets.length === 0 ? <div className="empty-state"><Icon name="tickets" size={28}/><h3>No tickets found</h3>
        <p>Try changing your filters or create a new support request.</p>
        <button className="btn btn-primary" onClick={onNew}>New ticket</button></div> :
      <div className="table-scroll"><table className="tickets-table"><thead><tr>
        <th>Ticket</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Updated</th><th></th>
      </tr></thead><tbody>{tickets.map(ticket => <tr key={ticket.id}>
        <td><button type="button" className="ticket-name" onClick={() => onOpen(ticket.id)}>
          <span>#{ticket.id} · {ticket.subject}</span><small>{ticket.customer}</small></button></td>
        <td><StatusBadge kind="status" value={ticket.status}/>{ticket.overdue && <span className="overdue-indicator">Overdue</span>}</td>
        <td><StatusBadge kind="priority" value={ticket.priority}/></td>
        <td>{ticket.assignee || <span className="muted">Unassigned</span>}</td>
        <td className="muted">{formatDate(ticket.updated_at)}</td>
        <td><button className="icon-btn" title={`Open ticket ${ticket.id}`} aria-label={`Open ticket ${ticket.id}`} onClick={() => onOpen(ticket.id)}>
          <Icon name="arrow-right"/></button></td>
      </tr>)}</tbody></table></div>}
    </section>}
  </div>
}
