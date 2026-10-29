import type {
  DashboardStats, Message, Ticket, TicketCreateInput, TicketDetail,
  TicketFilters, TicketUpdateInput,
} from '../types'

const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api' : '')
).replace(/\/+$/, '')

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Cannot reach the SupportDesk server. Check that the FastAPI backend is running on port 8000.')
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = await response.json() as { detail?: string | Array<{ loc?: string[]; msg?: string }> }
      if (typeof data.detail === 'string') message = data.detail
      else if (Array.isArray(data.detail)) message = data.detail.map(e => e.msg || 'Invalid input').join('; ')
    } catch { /* Preserve status message for non-JSON errors. */ }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export function readableError(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'An unexpected error occurred. Try again.'
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  dashboard: () => request<DashboardStats>('/dashboard'),
  listTickets: (filters: TicketFilters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) params.set(key, value.trim())
    })
    const query = params.toString()
    return request<Ticket[]>(`/tickets${query ? `?${query}` : ''}`)
  },
  getTicket: (id: number) => request<TicketDetail>(`/tickets/${id}`),
  createTicket: (ticket: TicketCreateInput) => request<Ticket>('/tickets', {
    method: 'POST', body: JSON.stringify(ticket),
  }),
  updateTicket: (id: number, changes: TicketUpdateInput) => request<Ticket>(`/tickets/${id}`, {
    method: 'PATCH', body: JSON.stringify(changes),
  }),
  addMessage: (id: number, message: { author: string; content: string; is_internal: boolean }) =>
    request<Message>(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify(message) }),
}
