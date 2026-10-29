import { useState, type FormEvent } from 'react'
import type { Ticket, TicketCreateInput, TicketPriority, TicketStatus } from '../types'
import { readableError } from '../services/api'
import Icon from './Icon'

const STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved']
const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent']

type Props = {
  initial?: Ticket
  submitLabel?: string
  onSubmit: (data: TicketCreateInput) => Promise<void>
  onCancel?: () => void
}

export default function TicketForm({ initial, submitLabel = 'Create ticket', onSubmit, onCancel }: Props) {
  const [subject, setSubject] = useState(initial?.subject || '')
  const [customer, setCustomer] = useState(initial?.customer || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [status, setStatus] = useState<TicketStatus>(initial?.status || 'Open')
  const [priority, setPriority] = useState<TicketPriority>(initial?.priority || 'Medium')
  const [assignee, setAssignee] = useState(initial?.assignee || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!subject.trim() || !customer.trim() || !description.trim()) {
      setError('Subject, customer and description are required.')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        subject: subject.trim(), customer: customer.trim(), description: description.trim(),
        status, priority, assignee: assignee.trim() || null,
      })
    } catch (cause) {
      setError(readableError(cause))
    } finally {
      setSaving(false)
    }
  }

  return <form className="ticket-form" onSubmit={handleSubmit}>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    <div className="form-grid">
      <div className="field full"><label htmlFor="subject">Subject <span className="required">*</span></label>
        <input id="subject" value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="e.g. Unable to access my account" maxLength={200} required /></div>
      <div className="field full"><label htmlFor="customer">Customer <span className="required">*</span></label>
        <input id="customer" value={customer} onChange={e => setCustomer(e.target.value)}
          placeholder="e.g. customer@example.com" maxLength={255} required /></div>
      <div className="field full"><label htmlFor="description">Description <span className="required">*</span></label>
        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Describe the issue and any steps to reproduce it…" rows={5} maxLength={5000} required />
        <div className="field-hint">{description.length} / 5000 characters</div></div>
      <div className="field"><label htmlFor="status">Status</label>
        <select id="status" value={status} onChange={e => setStatus(e.target.value as TicketStatus)}>
          {STATUSES.map(value => <option key={value} value={value}>{value}</option>)}
        </select></div>
      <div className="field"><label htmlFor="priority">Priority</label>
        <select id="priority" value={priority} onChange={e => setPriority(e.target.value as TicketPriority)}>
          {PRIORITIES.map(value => <option key={value} value={value}>{value}</option>)}
        </select></div>
      <div className="field full"><label htmlFor="assignee">Assignee</label>
        <input id="assignee" value={assignee} onChange={e => setAssignee(e.target.value)}
          placeholder="Agent name (optional)" maxLength={100} />
        <div className="field-hint">Leave blank to set the ticket as unassigned.</div></div>
    </div>
    <div className="form-actions">
      {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>}
      <button type="submit" className="btn btn-primary" disabled={saving}>
        <Icon name="check" size={17}/>{saving ? 'Saving…' : submitLabel}
      </button>
    </div>
  </form>
}
