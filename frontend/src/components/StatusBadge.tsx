import type { TicketPriority, TicketStatus } from '../types'

type Props = { kind: 'status'; value: TicketStatus } |
             { kind: 'priority'; value: TicketPriority } |
             { kind: 'overdue'; value?: never }

export default function StatusBadge(props: Props) {
  const value = props.kind === 'overdue' ? 'Overdue' : props.value
  const slug = String(value).toLowerCase().replace(/\s+/g, '-')
  return <span className={`status-badge ${props.kind}-${slug}`}>{value}</span>
}
