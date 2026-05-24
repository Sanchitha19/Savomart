import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/api/admin/login', { email, password })
      sessionStorage.setItem('admin_token', res.data.access_token)
      sessionStorage.setItem('admin_user', JSON.stringify(res.data.admin))
      toast.success(`Welcome back, ${res.data.admin.name}!`)
      navigate('/admin/dashboard')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #4A1A5C 0%, #782B90 50%, #9B3DB8 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: '1rem'
    }}>
      {/* Background circles */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(255,242,0,0.06)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)'
        }} />
      </div>

      <div style={{
        background: 'white',
        borderRadius: 24,
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8
          }}>
            <div style={{
              background: '#FFF200',
              color: '#782B90',
              width: 44, height: 44,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 22,
              boxShadow: '0 4px 12px rgba(255,242,0,0.4)'
            }}>S</div>
            <span style={{ fontWeight: 900, fontSize: 26, letterSpacing: '-0.5px' }}>
              <span style={{ color: '#782B90' }}>SAVO</span>
              <span style={{ color: '#1a1a1a' }}>mart</span>
            </span>
          </div>
          <div style={{
            display: 'inline-block',
            background: '#F3E8F7',
            color: '#782B90',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            padding: '4px 14px',
            borderRadius: 999,
            textTransform: 'uppercase'
          }}>Admin Portal</div>
        </div>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block', fontSize: 13, fontWeight: 600,
              color: '#444', marginBottom: 6
            }}>Email Address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@savomart.in"
              required
              style={{
                width: '100%', padding: '12px 16px',
                border: '1.5px solid #e0c9ea',
                borderRadius: 12, fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = '#782B90'}
              onBlur={e => e.target.style.borderColor = '#e0c9ea'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block', fontSize: 13, fontWeight: 600,
              color: '#444', marginBottom: 6
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 44px 12px 16px',
                  border: '1.5px solid #e0c9ea',
                  borderRadius: 12, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={e => e.target.style.borderColor = '#782B90'}
                onBlur={e => e.target.style.borderColor = '#e0c9ea'}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 16, color: '#888', padding: 0
                }}
              >{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="admin-login-btn"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #FFF200, #FFD700)',
              color: '#782B90',
              border: 'none',
              borderRadius: 14,
              fontWeight: 800,
              fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              letterSpacing: 0.5,
              boxShadow: loading ? 'none' : '0 6px 20px rgba(255,242,0,0.4)',
              fontFamily: 'inherit'
            }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: '1.5rem',
          background: '#F3E8F7',
          borderRadius: 14,
          padding: '14px 16px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#782B90', fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Demo Credentials
          </p>
          <p style={{ color: '#555', fontSize: 13, margin: '2px 0' }}>
            📧 admin@savomart.in
          </p>
          <p style={{ color: '#555', fontSize: 13, margin: '2px 0' }}>
            🔑 Admin@123
          </p>
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <a href="/login" style={{
            color: '#782B90', fontSize: 13, fontWeight: 600,
            textDecoration: 'none', opacity: 0.8
          }}>← Back to Customer App</a>
        </div>
      </div>
    </div>
  )
}
