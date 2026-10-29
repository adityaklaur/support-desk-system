import TicketForm from '../components/TicketForm'
import Icon from '../components/Icon'
import { api } from '../services/api'
import type { TicketCreateInput } from '../types'

export default function NewTicket({ onBack, onCreated }: { onBack: () => void; onCreated: (id: number) => void }) {
  async function create(values: TicketCreateInput) {
    const ticket = await api.createTicket(values)
    onCreated(ticket.id)
  }
  return <div className="page-stack">
    <button type="button" className="back-link" onClick={onBack}><Icon name="arrow-left" size={17}/> Back to tickets</button>
    <div className="page-heading"><div><p className="eyebrow">NEW REQUEST</p><h1>Create a ticket</h1>
      <p>Capture the issue and assign it to the right agent.</p></div></div>
    <section className="panel form-panel"><div className="panel-header"><div><h2>Ticket information</h2>
      <p>Fields marked * are required.</p></div></div>
      <TicketForm onSubmit={create} onCancel={onBack}/></section>
  </div>
}
