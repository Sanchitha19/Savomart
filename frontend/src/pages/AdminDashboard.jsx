import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const ADMIN_API = import.meta.env.VITE_API_URL
  || 'http://localhost:8001'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    categories: []
  })
  const [tickets, setTickets] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [updating, setUpdating] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const LIMIT = 20

  const admin = (() => {
    try {
      return JSON.parse(
        sessionStorage.getItem('admin_user') || '{}'
      )
    } catch { return {} }
  })()

  const getToken = () => {
    return sessionStorage.getItem('admin_token')
  }

  const adminFetch = async (path, options = {}) => {
    const token = getToken()
    if (!token) {
      navigate('/admin/login')
      return null
    }

    const cleanApi = ADMIN_API.endsWith('/') ? ADMIN_API.slice(0, -1) : ADMIN_API;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${cleanApi}${cleanPath}`;
    
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      }
    })

    if (res.status === 401) {
      sessionStorage.clear()
      navigate('/admin/login')
      return null
    }

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`${text}`)
    }

    return res.json()
  }

  const fetchStats = async () => {
    try {
      const data = await adminFetch('/api/admin/stats')
      if (data) setStats(data)
    } catch (err) {
      console.error('Stats error:', err)
    }
  }

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams({
        skip: ((page - 1) * LIMIT).toString(),
        limit: LIMIT.toString(),
      })
      if (statusFilter) params.append('status', statusFilter)
      if (categoryFilter) params.append('category', categoryFilter)
      if (search) params.append('search', search)

      const data = await adminFetch(
        `/api/admin/tickets?${params.toString()}`
      )
      if (data) {
        setTickets(data.tickets || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Tickets error:', err)
      setError(err.message)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchStats(), fetchTickets()])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!getToken()) {
      navigate('/admin/login')
      return
    }
    fetchAll()
  }, [page, statusFilter, categoryFilter])

  const handleSearch = () => {
    setPage(1)
    fetchAll()
  }

  const handleClear = () => {
    setSearch('')
    setStatusFilter('')
    setCategoryFilter('')
    setPage(1)
  }

  const updateStatus = async (ticketId, newStatus) => {
    setUpdating(ticketId)
    try {
      await adminFetch(
        `/api/admin/tickets/${ticketId}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        }
      )
      toast.success('Status updated!')
      fetchAll()
    } catch (err) {
      toast.error('Failed to update: ' + err.message)
    } finally {
      setUpdating(null)
    }
  }

  const downloadExcel = async () => {
    try {
      const token = getToken()
      const res = await fetch(
        `${ADMIN_API}/api/admin/download-excel`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'savomart_tickets.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Downloaded!')
    } catch (err) {
      toast.error('Download failed')
    }
  }

  const handleLogout = () => {
    sessionStorage.clear()
    navigate('/admin/login')
  }

  const statusStyle = (status) => {
    const styles = {
      Open: { bg: '#FFEBEE', color: '#C62828',
              dot: '#EF4444', label: '🔴 Open' },
      InProgress: { bg: '#FFFDE7', color: '#F57F17',
                    dot: '#F59E0B', label: '🟡 In Progress' },
      Resolved: { bg: '#E8F5E9', color: '#2E7D32',
                  dot: '#22C55E', label: '🟢 Resolved' }
    }
    return styles[status] || styles.Open
  }

  const StatusTimeline = ({ status }) => {
    const steps = [
      { key: 'Open', label: 'Open', color: '#EF4444' },
      { key: 'InProgress', label: 'In Progress',
        color: '#F59E0B' },
      { key: 'Resolved', label: 'Resolved',
        color: '#22C55E' },
    ]
    const currentIndex = steps.findIndex(
      s => s.key === status
    )

    return (
      <div className="flex items-center gap-2 py-3 px-4
                      bg-gray-50 rounded-xl mt-2">
        {steps.map((step, i) => (
          <div key={step.key}
               className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex
                           items-center justify-center
                           text-white text-xs font-bold
                           transition-all"
                style={{
                  background: i <= currentIndex
                    ? step.color : '#E0E0E0',
                  transform: i === currentIndex
                    ? 'scale(1.2)' : 'scale(1)'
                }}>
                {i < currentIndex ? '✓' : i + 1}
              </div>
              <span className="text-xs mt-1 font-medium"
                    style={{
                      color: i <= currentIndex
                        ? step.color : '#9E9E9E'
                    }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-1 rounded mx-2
                           transition-all"
                style={{
                  background: i < currentIndex
                    ? '#782B90' : '#E0E0E0'
                }} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    { label: 'Total', value: stats.total,
      color: '#782B90', icon: '🎫' },
    { label: 'Today', value: stats.today,
      color: '#3B82F6', icon: '📅' },
    { label: 'Open', value: stats.open,
      color: '#EF4444', icon: '🔴' },
    { label: 'In Progress', value: stats.in_progress,
      color: '#F59E0B', icon: '🟡' },
    { label: 'Resolved', value: stats.resolved,
      color: '#22C55E', icon: '🟢' },
  ]

  return (
    <div className="min-h-screen"
         style={{ background: '#F8F4FA' }}>

      {/* NAVBAR */}
      <div className="px-6 py-4 flex justify-between
                      items-center shadow-md sticky top-0 z-40"
           style={{ background: '#782B90' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex
                          items-center justify-center
                          font-bold text-lg"
               style={{ background: '#FFF200',
                        color: '#782B90' }}>
            S
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">
              SAVOmart Admin
            </h1>
            <p className="text-white/60 text-xs">
              Support Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-sm
                           hidden md:block">
            {admin.name || 'Admin'}
          </span>
          <button
            onClick={downloadExcel}
            className="px-4 py-2 rounded-xl text-sm
                       font-bold flex items-center gap-2"
            style={{ background: '#FFF200',
                     color: '#782B90' }}>
            ⬇ Excel
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-sm
                       border border-white/30 text-white">
            Logout
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">

        {/* ERROR BANNER */}
        {error && (
          <div className="mb-4 p-4 rounded-xl
                          flex items-center
                          justify-between"
               style={{ background: '#FFEBEE',
                        border: '1px solid #EF4444' }}>
            <p className="text-sm"
               style={{ color: '#C62828' }}>
              ⚠️ {error}
            </p>
            <button
              onClick={fetchAll}
              className="px-3 py-1 rounded-lg text-xs
                         text-white ml-4"
              style={{ background: '#EF4444' }}>
              Retry
            </button>
          </div>
        )}

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5
                        gap-3 mb-6">
          {statCards.map((card, i) => (
            <div key={i}
                 className="bg-white rounded-2xl p-4
                            shadow-sm text-center border-t-4"
                 style={{ borderColor: card.color }}>
              <div className="text-3xl mb-1">
                {card.icon}
              </div>
              <p className="text-3xl font-black"
                 style={{ color: card.color }}>
                {loading ? '—' : card.value}
              </p>
              <p className="text-xs text-gray-500 mt-1
                            font-medium">
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* CATEGORY PILLS */}
        {stats.categories.length > 0 && (
          <div className="bg-white rounded-2xl p-4
                          shadow-sm mb-4">
            <p className="text-sm font-bold mb-3"
               style={{ color: '#782B90' }}>
              Issues by Category
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.categories.map((cat, i) => (
                <span key={i}
                      className="px-3 py-1 rounded-full
                                 text-xs font-medium
                                 cursor-pointer"
                      onClick={() => {
                        setCategoryFilter(cat.category)
                        setPage(1)
                      }}
                      style={{ background: '#F3E8F7',
                               color: '#782B90' }}>
                  {cat.category}: {cat.count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH + FILTERS */}
        <div className="bg-white rounded-2xl p-4
                        shadow-sm mb-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' &&
                handleSearch()}
              className="px-4 py-2 border rounded-xl
                         text-sm flex-1 min-w-48
                         focus:outline-none"
              style={{ borderColor: '#782B90' + '40' }}
            />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border rounded-xl
                         text-sm focus:outline-none"
              style={{ borderColor: '#782B90' + '40' }}>
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="InProgress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border rounded-xl
                         text-sm focus:outline-none"
              style={{ borderColor: '#782B90' + '40' }}>
              <option value="">All Categories</option>
              <option value="Points Issue">
                Points Issue
              </option>
              <option value="Coupon Issue">
                Coupon Issue
              </option>
              <option value="Store Issue">
                Store Issue
              </option>
              <option value="App Issue">App Issue</option>
              <option value="Other">Other</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-xl text-sm
                         font-bold text-white"
              style={{ background: '#782B90' }}>
              Search
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-xl text-sm
                         border font-medium"
              style={{ color: '#782B90',
                       borderColor: '#782B90' }}>
              Clear
            </button>
          </div>
        </div>

        {/* TICKETS */}
        <div className="bg-white rounded-2xl shadow-sm
                        overflow-hidden">
          <div className="px-4 py-3 border-b flex
                          justify-between items-center">
            <h3 className="font-bold"
                style={{ color: '#782B90' }}>
              Support Tickets ({total})
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                Page {page} of {Math.ceil(total/LIMIT)||1}
              </span>
              <button
                onClick={fetchAll}
                className="text-sm px-3 py-1 rounded-lg"
                style={{ background: '#F3E8F7',
                         color: '#782B90' }}>
                ↻ Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 rounded-full
                              animate-spin mx-auto"
                   style={{ borderColor: '#782B90',
                            borderTopColor: 'transparent'}} />
              <p className="text-gray-400 mt-3 text-sm">
                Loading tickets...
              </p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🎫</p>
              <p className="text-gray-500 font-medium">
                No tickets found
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Submit a support request from the
                customer app to see it here
              </p>
              <button
                onClick={fetchAll}
                className="mt-4 px-6 py-2 rounded-xl
                           text-sm font-medium text-white"
                style={{ background: '#782B90' }}>
                Refresh
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {tickets.map(ticket => {
                const ss = statusStyle(ticket.status)
                const isExpanded =
                  expandedRow === ticket.id

                return (
                  <div key={ticket.id}>

                    {/* TICKET ROW */}
                    <div
                      className="p-4 hover:bg-gray-50
                                 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(
                        isExpanded ? null : ticket.id
                      )}>

                      <div className="flex items-start
                                      justify-between gap-4">

                        {/* Left: ticket info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center
                                          gap-2 mb-1 flex-wrap">
                            <span className="font-mono
                                             font-bold text-sm"
                                  style={{ color: '#782B90' }}>
                              {ticket.ticket_id}
                            </span>
                            {/* STATUS BADGE */}
                            <span
                              className="px-2 py-0.5 rounded-full
                                         text-xs font-bold"
                              style={{ background: ss.bg,
                                       color: ss.color }}>
                              {ss.label}
                            </span>
                            <span className="px-2 py-0.5
                                             rounded-full
                                             text-xs"
                                  style={{ background: '#F3E8F7',
                                           color: '#782B90' }}>
                              {ticket.issue_category}
                            </span>
                          </div>

                          <div className="flex items-center
                                          gap-3 mb-2">
                            <p className="font-bold text-gray-800">
                              {ticket.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              📱 {ticket.phone}
                            </p>
                          </div>

                          <p className="text-sm text-gray-600
                                        line-clamp-2">
                            {ticket.description}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(ticket.created_at)
                              .toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                          </p>
                        </div>

                        {/* Right: status change */}
                        <div className="flex flex-col
                                        items-end gap-2
                                        flex-shrink-0"
                             onClick={e => e.stopPropagation()}>
                          <select
                            value={ticket.status}
                            onChange={e => updateStatus(
                              ticket.id, e.target.value
                            )}
                            disabled={updating === ticket.id}
                            className="text-xs px-2 py-1 border
                                       rounded-lg focus:outline-none
                                       disabled:opacity-50
                                       cursor-pointer"
                            style={{ borderColor: ss.dot,
                                     color: ss.color }}>
                            <option value="Open">
                              Set Open
                            </option>
                            <option value="InProgress">
                              Set In Progress
                            </option>
                            <option value="Resolved">
                              Set Resolved
                            </option>
                          </select>
                          <span className="text-xs text-gray-400">
                            {isExpanded ? '▲ less' : '▼ details'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED — STATUS TIMELINE */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-gray-50
                                      border-t">
                        <p className="text-xs font-bold
                                      text-gray-500 mt-3 mb-2
                                      uppercase tracking-wide">
                          Ticket Progress
                        </p>
                        <StatusTimeline
                          status={ticket.status}
                        />
                        {ticket.email && (
                          <p className="text-xs text-gray-400
                                        mt-2">
                            📧 {ticket.email}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* PAGINATION */}
          {total > LIMIT && (
            <div className="flex justify-between items-center
                            px-4 py-3 border-t">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm
                           font-medium disabled:opacity-40"
                style={{ background: '#F3E8F7',
                         color: '#782B90' }}>
                ← Previous
              </button>
              <span className="text-sm text-gray-500">
                {(page-1)*LIMIT+1}–
                {Math.min(page*LIMIT, total)} of {total}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * LIMIT >= total}
                className="px-4 py-2 rounded-xl text-sm
                           font-medium disabled:opacity-40
                           text-white"
                style={{ background: '#782B90' }}>
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
