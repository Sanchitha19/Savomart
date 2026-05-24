import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const ADMIN_API = import.meta.env.VITE_API_URL || 'http://localhost:8001'

async function adminFetch(path, options = {}) {
  const token = sessionStorage.getItem('admin_token')
  const res = await fetch(`${ADMIN_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  })
  if (res.status === 401) {
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_user')
    window.location.href = '/admin/login'
    return null
  }
  return res.json()
}

const STATUS_CONFIG = {
  Open:       { color: '#DC2626', bg: '#FEF2F2', label: 'Open' },
  InProgress: { color: '#D97706', bg: '#FFFBEB', label: 'In Progress' },
  Resolved:   { color: '#16A34A', bg: '#F0FDF4', label: 'Resolved' }
}

const STAT_CARDS = [
  { key: 'total',       label: 'Total',       color: '#782B90', emoji: '🎫' },
  { key: 'today',       label: 'Today',       color: '#2563EB', emoji: '📅' },
  { key: 'open',        label: 'Open',        color: '#DC2626', emoji: '🔴' },
  { key: 'in_progress', label: 'In Progress', color: '#D97706', emoji: '🟡' },
  { key: 'resolved',    label: 'Resolved',    color: '#16A34A', emoji: '✅' }
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats]           = useState(null)
  const [tickets, setTickets]       = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatus]   = useState('')
  const [categoryFilter, setCategory] = useState('')
  const [search, setSearch]         = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage]             = useState(1)
  const [updating, setUpdating]     = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const admin = (() => {
    try { return JSON.parse(sessionStorage.getItem('admin_user') || '{}') }
    catch { return {} }
  })()

  const PER_PAGE = 20
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        skip: String((page - 1) * PER_PAGE),
        limit: String(PER_PAGE),
        ...(statusFilter   ? { status: statusFilter }     : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(search         ? { search }                   : {})
      })
      const [statsData, ticketsData] = await Promise.all([
        adminFetch('/api/admin/stats'),
        adminFetch(`/api/admin/tickets?${qs}`)
      ])
      if (statsData)   setStats(statsData)
      if (ticketsData) {
        setTickets(Array.isArray(ticketsData.tickets) ? ticketsData.tickets : [])
        setTotal(ticketsData.total || 0)
      }
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, categoryFilter, search])

  useEffect(() => {
    if (!sessionStorage.getItem('admin_token')) {
      navigate('/admin/login')
      return
    }
    fetchData()
  }, [fetchData, navigate])

  const updateStatus = async (ticketId, newStatus) => {
    setUpdating(ticketId)
    try {
      await adminFetch(`/api/admin/tickets/${ticketId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      toast.success('Status updated')
      fetchData()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_user')
    navigate('/admin/login')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const clearFilters = () => {
    setStatus('')
    setCategory('')
    setSearch('')
    setSearchInput('')
    setPage(1)
  }

  const downloadExcel = () => {
    const token = sessionStorage.getItem('admin_token')
    window.open(`${ADMIN_API}/api/admin/download-excel?token=${token}`, '_blank')
  }

  const s = (style) => style  // identity helper for readability

  return (
    <div id="admin-dashboard" style={{
      minHeight: '100vh',
      background: '#F5F0F8',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: '#1a1a2e'
    }}>
      {/* ── TOP NAV ─────────────────────────────────────────────────────── */}
      <nav style={{
        background: 'linear-gradient(135deg, #4A1A5C, #782B90)',
        padding: '0 1.5rem',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(78,27,144,0.3)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: '#FFF200', color: '#782B90',
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18
          }}>S</div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
              SAVOmart Admin
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              Support Dashboard
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, display: 'none' }}
                className="md-show">
            {admin.name || 'Admin'}
          </span>
          <button
            id="admin-download-excel"
            onClick={downloadExcel}
            style={{
              background: '#FFF200', color: '#782B90',
              border: 'none', borderRadius: 10,
              padding: '8px 16px', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >⬇ Excel</button>
          <button
            id="admin-logout"
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: 'white', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 10, padding: '8px 16px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}
          >Logout</button>
        </div>
      </nav>

      <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>

        {/* ── STATS ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12, marginBottom: 20
        }}>
          {STAT_CARDS.map(card => (
            <div key={card.key} style={{
              background: 'white', borderRadius: 16,
              padding: '1rem', textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderTop: `3px solid ${card.color}`
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{card.emoji}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: card.color, lineHeight: 1 }}>
                {stats ? stats[card.key] : '—'}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontWeight: 600 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── CATEGORY CHIPS ─────────────────────────────────────────────── */}
        {stats?.categories?.length > 0 && (
          <div style={{
            background: 'white', borderRadius: 16,
            padding: '1rem 1.25rem', marginBottom: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#782B90', marginBottom: 10 }}>
              Issues by Category
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {stats.categories.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => { setCategory(cat.category === categoryFilter ? '' : cat.category); setPage(1) }}
                  style={{
                    background: cat.category === categoryFilter ? '#782B90' : '#F3E8F7',
                    color: cat.category === categoryFilter ? 'white' : '#782B90',
                    border: 'none', borderRadius: 999,
                    padding: '6px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {cat.category} · {cat.count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FILTERS ────────────────────────────────────────────────────── */}
        <div style={{
          background: 'white', borderRadius: 16,
          padding: '1rem 1.25rem', marginBottom: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <form onSubmit={handleSearchSubmit}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <input
              id="admin-search"
              type="text"
              placeholder="Search name or phone…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{
                flex: '1 1 180px', padding: '9px 14px',
                border: '1.5px solid #e0c9ea', borderRadius: 10,
                fontSize: 13, outline: 'none', fontFamily: 'inherit'
              }}
            />
            <select
              id="admin-filter-status"
              value={statusFilter}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
              style={{
                padding: '9px 14px', border: '1.5px solid #e0c9ea',
                borderRadius: 10, fontSize: 13, outline: 'none',
                background: 'white', fontFamily: 'inherit', cursor: 'pointer'
              }}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="InProgress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select
              id="admin-filter-category"
              value={categoryFilter}
              onChange={e => { setCategory(e.target.value); setPage(1) }}
              style={{
                padding: '9px 14px', border: '1.5px solid #e0c9ea',
                borderRadius: 10, fontSize: 13, outline: 'none',
                background: 'white', fontFamily: 'inherit', cursor: 'pointer'
              }}
            >
              <option value="">All Categories</option>
              <option value="Points Issue">Points Issue</option>
              <option value="Coupon Issue">Coupon Issue</option>
              <option value="Store Issue">Store Issue</option>
              <option value="App Issue">App Issue</option>
              <option value="Other">Other</option>
            </select>
            <button type="submit" style={{
              background: '#782B90', color: 'white',
              border: 'none', borderRadius: 10,
              padding: '9px 18px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit'
            }}>Search</button>
            <button type="button" onClick={clearFilters} style={{
              background: 'white', color: '#782B90',
              border: '1.5px solid #e0c9ea', borderRadius: 10,
              padding: '9px 14px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit'
            }}>Clear</button>
          </form>
        </div>

        {/* ── TICKETS ────────────────────────────────────────────────────── */}
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #F0E6F6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontWeight: 800, color: '#782B90', fontSize: 15 }}>
              Support Tickets ({total})
            </span>
            <span style={{ fontSize: 12, color: '#999', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '3px solid #e0c9ea',
                borderTop: '3px solid #782B90',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
              <div style={{ fontWeight: 600 }}>No tickets found</div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8F0FC' }}>
                      {['Ticket ID','Name','Phone','Category','Description','Status','Date','Action'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', textAlign: 'left',
                          fontWeight: 700, color: '#782B90',
                          fontSize: 12, whiteSpace: 'nowrap'
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket, idx) => {
                      const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.Open
                      const isExpanded = expandedId === ticket.id
                      return (
                        <tr key={ticket.id} style={{
                          borderTop: '1px solid #F5F0F8',
                          background: idx % 2 === 0 ? 'white' : '#FDFBFF',
                          transition: 'background 0.15s'
                        }}>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              fontFamily: 'monospace', fontWeight: 700,
                              fontSize: 12, color: '#782B90'
                            }}>{ticket.ticket_id}</span>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                            {ticket.name}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#666' }}>
                            {ticket.phone}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              background: '#F3E8F7', color: '#782B90',
                              padding: '3px 10px', borderRadius: 999,
                              fontSize: 11, fontWeight: 600
                            }}>{ticket.issue_category}</span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#555', maxWidth: 200 }}>
                            <div
                              onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                              style={{
                                cursor: 'pointer',
                                overflow: isExpanded ? 'visible' : 'hidden',
                                textOverflow: isExpanded ? 'unset' : 'ellipsis',
                                whiteSpace: isExpanded ? 'normal' : 'nowrap',
                                maxWidth: 180
                              }}
                              title={isExpanded ? '' : ticket.description}
                            >
                              {ticket.description}
                              {!isExpanded && ticket.description.length > 40 &&
                                <span style={{ color: '#782B90', fontSize: 11, marginLeft: 4 }}>
                                  [+]
                                </span>
                              }
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              background: sc.bg, color: sc.color,
                              padding: '4px 10px', borderRadius: 999,
                              fontSize: 11, fontWeight: 700
                            }}>{sc.label}</span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <select
                              value={ticket.status}
                              disabled={updating === ticket.id}
                              onChange={e => updateStatus(ticket.id, e.target.value)}
                              style={{
                                padding: '6px 10px',
                                border: '1.5px solid #e0c9ea',
                                borderRadius: 8, fontSize: 12,
                                outline: 'none', cursor: 'pointer',
                                background: 'white', fontFamily: 'inherit',
                                opacity: updating === ticket.id ? 0.5 : 1
                              }}
                            >
                              <option value="Open">Open</option>
                              <option value="InProgress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── PAGINATION ─────────────────────────────────────────────── */}
          {total > PER_PAGE && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderTop: '1px solid #F0E6F6'
            }}>
              <button
                id="admin-prev-page"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                style={{
                  background: '#F3E8F7', color: '#782B90',
                  border: 'none', borderRadius: 10,
                  padding: '8px 16px', fontSize: 13, fontWeight: 600,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.4 : 1
                }}
              >← Previous</button>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>
                {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, total)} of {total}
              </span>
              <button
                id="admin-next-page"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                style={{
                  background: '#782B90', color: 'white',
                  border: 'none', borderRadius: 10,
                  padding: '8px 16px', fontSize: 13, fontWeight: 600,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.4 : 1
                }}
              >Next →</button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
