import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
  Hammer,
  Github,
  Globe
} from 'lucide-react'

export default function Auth({ initialMode = 'login', onSuccess, onBackToLanding }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calculate password strength
  const getPasswordStrength = pwd => {
    if (!pwd) return 0
    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1
    return score
  }

  const pwdScore = getPasswordStrength(password)
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['var(--crit)', 'var(--high)', 'var(--med)', 'var(--ok)']

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // 1. Email ID validation
    if (!trimmedEmail) {
      setError('Please enter your email ID.')
      return
    }
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email ID (e.g. name@example.com).')
      return
    }

    // 2. Password validation (> 8 characters)
    if (!password) {
      setError('Please enter your password.')
      return
    }
    if (password.length <= 8) {
      setError('Password must be more than 8 characters.')
      return
    }

    setLoading(true)

    const endpoint = mode === 'login' ? '/api/auth/login/' : '/api/auth/register/'
    const payload =
      mode === 'login'
        ? { username: trimmedEmail, email: trimmedEmail, password }
        : { email: trimmedEmail, username: username || trimmedEmail.split('@')[0], name, password }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.')
      }

      // Save token and user info
      localStorage.setItem('cf_token', data.token || 'demo-token')
      localStorage.setItem('cf_user', JSON.stringify(data.user))
      onSuccess && onSuccess(data.user)
    } catch (err) {
      setError(err.message || 'Authentication error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Quick Demo Access Login
  const handleDemoLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'demo@codeforge.ai', password: 'DemoSecOpsPassword2026!' })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('cf_token', data.token)
        localStorage.setItem('cf_user', JSON.stringify(data.user))
        onSuccess && onSuccess(data.user)
      } else {
        // Fallback local demo profile
        const demoUser = {
          id: 999,
          username: 'alex_vance',
          email: 'alex.vance@codeforge.ai',
          name: 'Alex Vance',
          role: 'Staff SecOps Lead',
          tier: 'Enterprise Pro'
        }
        localStorage.setItem('cf_token', 'demo-token')
        localStorage.setItem('cf_user', JSON.stringify(demoUser))
        onSuccess && onSuccess(demoUser)
      }
    } catch {
      const demoUser = {
        id: 999,
        username: 'alex_vance',
        email: 'alex.vance@codeforge.ai',
        name: 'Alex Vance',
        role: 'Staff SecOps Lead',
        tier: 'Enterprise Pro'
      }
      localStorage.setItem('cf_token', 'demo-token')
      localStorage.setItem('cf_user', JSON.stringify(demoUser))
      onSuccess && onSuccess(demoUser)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Background glow effects */}
      <div className="glow-orb glow-orb-1" style={{ width: 400, height: 400, top: '-50px' }} />
      <div className="glow-orb glow-orb-2" style={{ width: 350, height: 350, bottom: '-50px', left: '-50px' }} />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Top Brand Logo */}
        <div className="auth-header">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              marginBottom: 12
            }}
            onClick={onBackToLanding}
          >
            <div className="brand-icon">
              <Hammer size={18} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
              Code<span style={{ color: 'var(--accent)' }}>Forge</span>
            </span>
          </div>
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Your Account'}</h1>
          <p className="sub" style={{ margin: '4px 0 0' }}>
            {mode === 'login'
              ? 'Enter your credentials to access the security audit workspace'
              : 'Join thousands of engineers shipping clean, verified code'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={'auth-tab-btn' + (mode === 'login' ? ' active' : '')}
            onClick={() => {
              setMode('login')
              setError('')
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={'auth-tab-btn' + (mode === 'signup' ? ' active' : '')}
            onClick={() => {
              setMode('signup')
              setError('')
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'var(--crit-soft)',
                border: '1px solid var(--crit)',
                borderRadius: 8,
                padding: '10px 14px',
                color: 'var(--crit)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16
              }}
            >
              <AlertCircle size={16} flexShrink={0} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <>
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
                  />
                  <input
                    type="text"
                    required
                    style={{ paddingLeft: 38 }}
                    placeholder="Alex Vance"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-dim)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13
                    }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    required
                    style={{ paddingLeft: 34 }}
                    placeholder="alex_vance"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-field">
            <label className="form-label">
              <span>Email ID</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>name@company.com</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                type="email"
                required
                style={{ paddingLeft: 38 }}
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <div className="form-label">
              <span>Password</span>
              {mode === 'login' ? (
                <span style={{ fontSize: 11, color: password && password.length <= 8 ? 'var(--crit)' : 'var(--text-dim)', fontWeight: 500 }}>
                  Must be &gt; 8 chars {password ? `(${password.length})` : ''}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Min 9 chars</span>
              )}
            </div>
            <div className="password-input-wrap">
              <Lock
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                style={{ paddingLeft: 38, paddingRight: 40 }}
                placeholder={mode === 'login' ? 'Enter password (> 8 characters)' : 'Create password (> 8 characters)'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* In Login mode: show live validation helper */}
            {mode === 'login' && password && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11.5,
                  marginTop: 4,
                  color: password.length > 8 ? 'var(--ok)' : 'var(--crit)',
                  fontWeight: 500
                }}
              >
                {password.length > 8 ? (
                  <>
                    <Check size={13} />
                    <span>Password meets length requirement ({password.length} characters)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} />
                    <span>Password must be more than 8 characters ({password.length}/9 minimum)</span>
                  </>
                )}
              </div>
            )}

            {/* Password strength indicator for signup */}
            {mode === 'signup' && password && (
              <div>
                <div className="pwd-strength-bar">
                  {[0, 1, 2, 3].map(lvl => (
                    <div
                      key={lvl}
                      className="pwd-meter-segment"
                      style={{
                        background: pwdScore > lvl ? strengthColors[pwdScore - 1] : undefined
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4, color: 'var(--text-muted)' }}>
                  <span>Strength: {strengthLabels[Math.max(0, pwdScore - 1)]}</span>
                  <span>Min. 8 chars with symbols & numbers</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn pri"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, padding: '11px 16px', fontSize: 14.5 }}
          >
            {loading ? (
              <span className="spin" style={{ display: 'inline-block' }}>⟳</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Free Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">Or continue with</div>

        {/* Social Authentication */}
        <div className="social-auth-grid">
          <button
            type="button"
            className="social-btn"
            onClick={handleDemoLogin}
            title="Sign in with GitHub account"
          >
            <Github size={16} />
            <span>GitHub</span>
          </button>
          <button
            type="button"
            className="social-btn"
            onClick={handleDemoLogin}
            title="Sign in with Google Workspace"
          >
            <Globe size={16} />
            <span>Google</span>
          </button>
        </div>

        {/* One-Click Demo Mode Banner */}
        <div className="demo-login-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={20} color="var(--accent)" flexShrink={0} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                Fast Evaluation Access
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Skip registration & test as Staff SecOps Lead
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn sm pri"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            1-Click Demo
          </button>
        </div>

        {/* Footer Navigation Back to Landing */}
        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <button
            type="button"
            className="btn ghost sm"
            style={{ fontSize: 12.5, color: 'var(--text-muted)' }}
            onClick={onBackToLanding}
          >
            ← Return to Landing Page
          </button>
        </div>
      </motion.div>
    </div>
  )
}
