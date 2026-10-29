import { useEffect, useState } from 'react'
import Icon from './components/Icon'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import TicketDetails from './pages/TicketDetails'
import NewTicket from './pages/NewTicket'

type View = { page: 'dashboard' | 'tickets' | 'new' } | { page: 'detail'; id: number }

function parseHash(): View {
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (hash === 'new') return { page: 'new' }
  if (hash === 'tickets') return { page: 'tickets' }
  const match = hash.match(/^tickets\/(\d+)$/)
  if (match) return { page: 'detail', id: Number(match[1]) }
  return { page: 'dashboard' }
}

export default function App() {
  const [view, setView] = useState<View>(parseHash)
  useEffect(() => {
    const handle = () => setView(parseHash())
    window.addEventListener('hashchange', handle)
    return () => window.removeEventListener('hashchange', handle)
  }, [])
  function navigate(destination: View) {
    const hash = destination.page === 'detail' ? `tickets/${destination.id}` : destination.page
    window.location.hash = `/${hash}`
    setView(destination)
  }
  const openTickets = () => navigate({ page: 'tickets' })
  const openNew = () => navigate({ page: 'new' })
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-icon"><Icon name="tickets" size={23}/></span>
      <div><strong>SupportDesk</strong><small>Agent workspace</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">
        <button className={view.page === 'dashboard' ? 'active' : ''} onClick={() => navigate({ page: 'dashboard' })}>
          <Icon name="dashboard" size={19}/> Dashboard</button>
        <button className={['tickets', 'detail'].includes(view.page) ? 'active' : ''} onClick={openTickets}>
          <Icon name="tickets" size={19}/> Tickets</button>
        <button className={view.page === 'new' ? 'active' : ''} onClick={openNew}>
          <Icon name="plus" size={19}/> Create ticket</button>
      </nav>
      <div className="sidebar-footer"><span className="live-dot"/> Local development<br/><small>FastAPI · React · SQLite</small></div>
    </aside>
    <div className="content-shell">
      <header className="topbar"><div><span className="topbar-subtitle">Support operations</span>
        <span className="topbar-divider">/</span><strong>{view.page === 'detail' ? `Ticket #${view.id}` : view.page === 'new' ? 'New ticket' : view.page === 'tickets' ? 'Tickets' : 'Overview'}</strong></div>
        <div className="topbar-right"><span className="environment-pill"><span className="live-dot"/> Local workspace</span></div></header>
      <main className="main-content">
        {view.page === 'dashboard' && <Dashboard onNew={openNew} onTickets={openTickets}/>}
        {view.page === 'tickets' && <Tickets onOpen={id => navigate({ page: 'detail', id })} onNew={openNew}/>}
        {view.page === 'new' && <NewTicket onBack={openTickets} onCreated={id => navigate({ page: 'detail', id })}/>}
        {view.page === 'detail' && <TicketDetails key={view.id} id={view.id} onBack={openTickets}/>}
      </main>
    </div>
  </div>
}
