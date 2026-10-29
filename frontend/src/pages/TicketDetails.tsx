import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { TicketCreateInput, TicketDetail, TicketUpdateInput } from '../types'
import { api, readableError } from '../services/api'
import { formatDate } from '../utils/format'
import Icon from '../components/Icon'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import TicketForm from '../components/TicketForm'

export default function TicketDetails({ id, onBack }: { id: number; onBack: () => void }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageError, setMessageError] = useState('')

  const load = useCallback(async () => {
    const data = await api.getTicket(id)
    setTicket(data)
  }, [id])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.getTicket(id)
      .then(data => { if (active) setTicket(data) })
      .catch(cause => { if (active) setError(readableError(cause)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, retryKey])

  async function saveEdits(values: TicketCreateInput) {
    // Stage 4 PATCH supports exactly these editable fields.
    const payload: TicketUpdateInput = values
    await api.updateTicket(id, payload)
    await load()
    setEditing(false)
    setNotice('Ticket updated successfully.')
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessageError('')
    setNotice('')
    if (!author.trim() || !content.trim()) {
      setMessageError('Author and message are required.')
      return
    }
    setSending(true)
    try {
      await api.addMessage(id, {
        author: author.trim(), content: content.trim(), is_internal: isInternal,
      })
      await load()
      setContent('')
      setNotice(isInternal ? 'Internal note added.' : 'Public reply added.')
    } catch (cause) {
      setMessageError(readableError(cause))
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading ticket details…" />
  if (error || !ticket) return <div className="page-stack"><button type="button" className="back-link"
    onClick={onBack}><Icon name="arrow-left" size={17}/> Back to tickets</button>
    <div className="alert alert-error" role="alert">{error || 'Ticket not found'}</div>
    <button type="button" className="btn btn-outline" onClick={() => setRetryKey(key => key + 1)}>Retry loading ticket</button></div>

  return <div className="page-stack">
    <button type="button" className="back-link" onClick={onBack}>
      <Icon name="arrow-left" size={17}/> Back to tickets</button>
    {notice && <div className="alert alert-success" role="status"><Icon name="check" size={17}/>{notice}</div>}
    <section className="panel ticket-title-panel">
      <div className="ticket-heading"><div><div className="id-text">TICKET #{ticket.id}</div>
        <h2>{ticket.subject}</h2><p>Created {formatDate(ticket.created_at)}</p></div>
        <button type="button" className="btn btn-outline" onClick={() => setEditing(v => !v)}>
          <Icon name={editing ? 'close' : 'edit'} size={17}/>{editing ? 'Cancel editing' : 'Edit ticket'}</button>
      </div>
      <div className="ticket-labels"><StatusBadge kind="status" value={ticket.status}/>
        <StatusBadge kind="priority" value={ticket.priority}/>
        {ticket.overdue && <StatusBadge kind="overdue"/>}</div>
    </section>

    {editing ? <section className="panel form-panel"><div className="panel-header"><div>
      <h2>Edit ticket</h2><p>Update the ticket details and assignment</p></div></div>
      <TicketForm key={ticket.id} initial={ticket} submitLabel="Save changes"
        onSubmit={saveEdits} onCancel={() => setEditing(false)}/></section>
      : <section className="panel ticket-meta-panel"><div className="meta-grid">
        <div><span className="meta-label">Customer</span><strong>{ticket.customer}</strong></div>
        <div><span className="meta-label">Assigned to</span><strong>{ticket.assignee || 'Unassigned'}</strong></div>
        <div><span className="meta-label">Last updated</span><strong>{formatDate(ticket.updated_at)}</strong></div>
      </div><div className="description-block"><span className="meta-label">Description</span>
        <p className="preserve-lines">{ticket.description}</p></div>
      </section>}

    <div className="details-grid">
      <section className="panel conversations-panel">
        <div className="panel-header"><div><h2><Icon name="message" size={19}/> Conversation</h2>
          <p>{ticket.messages.length} message{ticket.messages.length === 1 ? '' : 's'}</p></div></div>
        <div className="conversation-feed">
          {ticket.messages.length === 0 ? <div className="empty-inline">No replies or notes yet.</div> :
            ticket.messages.map(message => <article className={`message-card ${message.is_internal ? 'internal-message' : ''}`}
              key={message.id}>
              <div className="message-header"><span className="user-circle">{message.author[0]?.toUpperCase()}</span>
                <strong>{message.author}</strong><span className="message-type">{message.is_internal ? 'Internal note' : 'Public reply'}</span></div>
              <p className="preserve-lines">{message.content}</p>
              <span className="muted small">{formatDate(message.created_at)}</span>
            </article>)}
        </div>
        <form className="composer" onSubmit={submitMessage}>
          <h3>Leave a reply or note</h3>
          <div className="message-tabs" role="group" aria-label="Message visibility">
            <button type="button" className={!isInternal ? 'selected' : ''} aria-pressed={!isInternal}
              onClick={() => setIsInternal(false)}>Public reply</button>
            <button type="button" className={isInternal ? 'selected' : ''} aria-pressed={isInternal}
              onClick={() => setIsInternal(true)}>Internal note</button>
          </div>
          {isInternal && <p className="internal-warning">This note is labeled internal but is not permission-protected in this prototype.</p>}
          {messageError && <div className="alert alert-error" role="alert">{messageError}</div>}
          <div className="field"><label htmlFor="message-author">Your name <span className="required">*</span></label>
            <input id="message-author" required maxLength={100} value={author} onChange={e => setAuthor(e.target.value)}
              placeholder="e.g. Asha"/></div>
          <div className="field"><label htmlFor="message-content">Message <span className="required">*</span></label>
            <textarea id="message-content" required maxLength={5000} rows={4} value={content}
              onChange={e => setContent(e.target.value)} placeholder="Write your message here…"/></div>
          <div className="form-actions"><button type="submit" className="btn btn-primary" disabled={sending}>
            <Icon name="send" size={16}/>{sending ? 'Sending…' : isInternal ? 'Add internal note' : 'Send reply'}
          </button></div>
        </form>
      </section>
      <section className="panel history-panel">
        <div className="panel-header"><div><h2><Icon name="activity" size={19}/> Activity history</h2>
          <p>Changes and communication events</p></div></div>
        <div className="history-feed">{ticket.history.length === 0 ?
          <div className="empty-inline">No activity recorded.</div> :
          ticket.history.map(entry => <div key={entry.id} className="history-item">
            <div className="history-line-marker"/><div><strong>{entry.description}</strong>
              <span className="muted small">{formatDate(entry.created_at)}</span></div>
          </div>)}
        </div>
      </section>
    </div>
  </div>
}
