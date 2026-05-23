import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [copied, setCopied] = useState(null)

  // Fetch all profile data
  useEffect(() => {
    fetchAllData()
  }, [])

  // Handle tab param from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('tab') === 'history') {
      setTimeout(() => {
        document.getElementById('points-history')
          ?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    }
  }, [location, loading])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [profileRes, statsRes, couponsRes, historyRes] = 
        await Promise.all([
          api.get('/api/users/me'),
          api.get('/api/users/me/stats'),
          api.get('/api/users/me/coupons'),
          api.get('/api/users/me/points-history?limit=10&skip=0')
        ])
      setProfile(profileRes.data)
      setStats(statsRes.data)
      setCoupons(couponsRes.data)
      setEditName(profileRes.data.name)
      
      // Handle both paginated and non-paginated response
      const histData = historyRes.data
      if (Array.isArray(histData)) {
        setTransactions(histData)
        setTotalPages(1)
      } else {
        setTransactions(histData.transactions || [])
        setTotalPages(histData.pages || 1)
      }
    } catch (error) {
      console.error('Profile error:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async (pageNum) => {
    try {
      const res = await api.get(
        `/api/users/me/points-history?limit=10&skip=${(pageNum-1)*10}`
      )
      const histData = res.data
      if (Array.isArray(histData)) {
        setTransactions(histData)
      } else {
        setTransactions(histData.transactions || [])
        setTotalPages(histData.pages || 1)
      }
      setPage(pageNum)
    } catch (error) {
      toast.error('Failed to load history')
    }
  }

  const handleSave = async () => {
    try {
      const res = await api.put('/api/users/me', { name: editName })
      setProfile(res.data)
      setEditing(false)
      toast.success('Profile updated!')
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    toast.success('Code copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredCoupons = coupons.filter(c => {
    const expired = new Date(c.expiry_date) <= new Date()
    if (activeTab === 'active') return !c.is_used && !expired
    if (activeTab === 'used') return c.is_used
    if (activeTab === 'expired') return expired && !c.is_used
    return true
  })

  const getTierColor = (tier) => {
    if (tier === 'Platinum') return '#E5E4E2'
    if (tier === 'Gold') return '#FFF200'
    return '#C0C0C0'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen"
           style={{ background: '#F8F4FA' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
               style={{ 
                 borderColor: '#782B90', 
                 borderTopColor: 'transparent' 
               }} />
          <p style={{ color: '#782B90' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <p className="text-gray-500 mb-4">Failed to load profile</p>
          <button
            onClick={fetchAllData}
            className="px-6 py-2 rounded-lg text-white"
            style={{ background: '#782B90' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="pb-24" style={{ background: '#F8F4FA', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div className="px-4 pt-6 pb-8"
           style={{ background: 'linear-gradient(135deg, #782B90, #4A1A5C)' }}>
        
        {/* Avatar */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center
                          text-2xl font-bold mb-3"
               style={{ background: '#FFF200', color: '#782B90' }}>
            {initials}
          </div>
          
          {editing ? (
            <div className="flex gap-2 items-center">
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="px-3 py-1 rounded-lg text-center font-bold text-lg"
                style={{ color: '#782B90' }}
              />
              <button onClick={handleSave}
                      className="px-3 py-1 rounded-lg text-sm font-medium"
                      style={{ background: '#FFF200', color: '#782B90' }}>
                Save
              </button>
              <button onClick={() => setEditing(false)}
                      className="px-3 py-1 rounded-lg text-sm text-white border
                                 border-white/30">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-white text-xl font-bold">{profile.name}</h1>
              <button onClick={() => setEditing(true)}
                      className="text-white/60 text-sm">✏️</button>
            </div>
          )}
          
          <p className="text-white/70 text-sm mt-1">
            +91 {profile.phone_number}
          </p>
          
          {/* Tier badge */}
          <div className="mt-2 px-4 py-1 rounded-full text-sm font-bold"
               style={{ 
                 background: getTierColor(profile.tier),
                 color: '#782B90'
               }}>
            ⭐ {profile.tier} Member
          </div>
        </div>

        {/* Tier progress */}
        {stats && (
          <div className="bg-white/10 rounded-xl p-4 mx-2">
            <div className="flex justify-between text-white/80 text-xs mb-2">
              <span>{profile.tier}</span>
              <span>{stats.next_tier || 'Max Tier'}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                   style={{ 
                     width: `${stats.tier_progress || 0}%`,
                     background: '#FFF200'
                   }} />
            </div>
            {stats.points_to_next_tier > 0 && (
              <p className="text-white/70 text-xs mt-2 text-center">
                {stats.points_to_next_tier} points to {stats.next_tier}
              </p>
            )}
          </div>
        )}
      </div>

      {/* STATS ROW */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 px-4 -mt-4">
          {[
            { label: 'Points', value: stats.points_balance?.toLocaleString() },
            { label: 'Coupons', value: stats.coupons_count },
            { label: 'Days', value: stats.member_since_days },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className="text-xl font-bold" style={{ color: '#782B90' }}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* COUPONS SECTION */}
      <div className="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-bold text-lg" style={{ color: '#782B90' }}>
            My Coupons
          </h2>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          {['active', 'used', 'expired'].map(tab => (
            <button key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 py-2 text-sm font-medium capitalize
                               transition-colors"
                    style={{
                      color: activeTab === tab ? '#782B90' : '#999',
                      borderBottom: activeTab === tab 
                        ? '2px solid #782B90' : '2px solid transparent'
                    }}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">🎫</p>
              <p>No {activeTab} coupons</p>
            </div>
          ) : (
            filteredCoupons.map(coupon => (
              <div key={coupon.id}
                   className="border-2 border-dashed rounded-xl p-4 relative"
                   style={{ borderColor: '#782B90' + '40' }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{coupon.title}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {coupon.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Expires: {new Date(coupon.expiry_date)
                        .toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <div className="px-3 py-1 rounded-lg font-mono font-bold text-sm"
                         style={{ background: '#FFF200', color: '#782B90' }}>
                      {coupon.code}
                    </div>
                    <button
                      onClick={() => copyCoupon(coupon.code)}
                      className="mt-2 text-xs"
                      style={{ color: '#782B90' }}>
                      {copied === coupon.code ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* POINTS HISTORY */}
      <div id="points-history" className="mx-4 mt-6 bg-white rounded-2xl shadow-sm">
        <div className="px-4 pt-4 pb-2 flex justify-between items-center">
          <h2 className="font-bold text-lg" style={{ color: '#782B90' }}>
            Points History
          </h2>
          <span className="text-sm text-gray-400">Page {page}/{totalPages}</span>
        </div>

        <div className="divide-y">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📊</p>
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="flex items-center px-4 py-3 gap-3">
                <div className="w-10 h-10 rounded-full flex items-center 
                                justify-center flex-shrink-0 text-lg"
                     style={{ 
                       background: tx.points > 0 ? '#E8F5E9' : '#FFEBEE'
                     }}>
                  {tx.points > 0 ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="font-bold text-sm flex-shrink-0"
                     style={{ color: tx.points > 0 ? '#4CAF50' : '#F44336' }}>
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t">
            <button
              onClick={() => fetchHistory(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ background: '#F3E8F7', color: '#782B90' }}>
              ← Previous
            </button>
            <button
              onClick={() => fetchHistory(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ background: '#782B90', color: 'white' }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* LOGOUT */}
      <div className="mx-4 mt-6 mb-4">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full py-3 rounded-xl border-2 font-medium"
          style={{ borderColor: '#EF4444', color: '#EF4444' }}>
          Log Out
        </button>
      </div>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center 
                        justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Log out?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              You will need to verify your phone number to log back in.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-xl border font-medium text-gray-600">
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl font-medium text-white"
                style={{ background: '#EF4444' }}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
