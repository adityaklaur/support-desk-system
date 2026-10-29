export type TicketStatus = 'Open' | 'In Progress' | 'Waiting on Customer' | 'Resolved'
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type SortBy = 'updated' | 'priority'

export type Ticket = {
  id: number
  subject: string
  customer: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  assignee: string | null
  created_at: number
  updated_at: number
  overdue: boolean
}

export type Message = {
  id: number
  ticket_id: number
  author: string
  content: string
  is_internal: boolean
  created_at: number
}

export type Activity = {
  id: number
  ticket_id: number
  event_type: string
  description: string
  created_at: number
}

export type TicketDetail = Ticket & {
  messages: Message[]
  history: Activity[]
}

export type TicketCreateInput = Pick<Ticket, 'subject' | 'customer' | 'description' | 'status' | 'priority' | 'assignee'>
export type TicketUpdateInput = Partial<TicketCreateInput>

export type TicketFilters = {
  search?: string
  status?: TicketStatus | ''
  priority?: TicketPriority | ''
  assignee?: string
  sort_by?: SortBy
}

export type DashboardStats = {
  total: number
  open: number
  in_progress: number
  waiting_on_customer: number
  resolved: number
  urgent: number
  overdue: number
}
