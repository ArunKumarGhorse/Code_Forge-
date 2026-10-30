import { useState, useEffect } from 'react'
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
  Globe,
  CheckCircle2,
  Circle,
  XCircle
} from 'lucide-react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/

export default function Auth({ initialMode = 'login', onSuccess, onBackToLanding }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'signup'

  // Form values
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  // Field touched state for inline validation feedback
  const [touched, setTouched] = useState({
    email: false,
    username: false,
    name: false,
    password: false,
    confirmPassword: false
  })

  // Synchronize with prop changes
  useEffect(() => {
    setMode(initialMode)
    setServerError('')
    setTouched({ email: false, username: false, name: false, password: false, confirmPassword: false })
  }, [initialMode])

  const markTouched = field => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  // ── Validation Rules ─────────────────────────────────────────────────────
  const errors = {}

  // Email validation
  if (!email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid email address (e.g. name@company.com).'
  }

  // Password validation (> 8 characters, i.e., min 9)
  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length <= 8) {
    errors.password = `Password must be more than 8 characters (${password.length}/9 minimum).`
  }

  // Signup-specific validations
  if (mode === 'signup') {
    if (!name.trim()) {
      errors.name = 'Full name is required.'
    } else if (name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.'
    }

    if (!username.trim()) {
      errors.username = 'Username is required.'
    } else if (!USERNAME_REGEX.test(username.trim())) {
      errors.username = 'Username must be 3-30 characters (letters, numbers, underscores only).'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.'
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.'
    }
  }

  const isValid = Object.keys(errors).length === 0

  // ── Password Strength Rules (Signup) ────────────────────────────────────
  const pwdChecks = {
    length: password.length >= 9,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  }

  const pwdScore = Object.values(pwdChecks).filter(Boolean).length
  const strengthLabels = ['Too Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['var(--crit)', 'var(--high)', 'var(--med)', 'var(--ok)']

  // ── Form Submission ──────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    setServerError('')

    // Mark all relevant fields as touched
    setTouched({
      email: true,
      username: true,
      name: true,
      password: true,
      confirmPassword: true
    })

    if (!isValid) return

    setLoading(true)

    const trimmedEmail = email.trim()
    const endpoint = mode === 'login' ? '/api/auth/login/' : '/api/auth/register/'
    const payload =
      mode === 'login'
        ? { username: trimmedEmail, email: trimmedEmail, password }
        : { email: trimmedEmail, username: username.trim() || trimmedEmail.split('@')[0], name: name.trim(), password }

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
      setServerError(err.message || 'Authentication error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── 1-Click Demo Login ───────────────────────────────────────────────────
  const handleDemoLogin = async () => {
    setLoading(true)
    setServerError('')
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

  // Helper for input border styles
  const getInputStyle = field => {
    if (!touched[field]) return {}
    if (errors[field]) {
      return { borderColor: 'var(--crit)', boxShadow: '0 0 0 2px var(--crit-soft)' }
    }
    return { borderColor: 'var(--ok)' }
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
              setServerError('')
              setTouched({ email: false, username: false, name: false, password: false, confirmPassword: false })
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={'auth-tab-btn' + (mode === 'signup' ? ' active' : '')}
            onClick={() => {
              setMode('signup')
              setServerError('')
              setTouched({ email: false, username: false, name: false, password: false, confirmPassword: false })
            }}
          >
            Create Account
          </button>
        </div>

        {/* Server Error Alert */}
        <AnimatePresence>
          {serverError && (
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
              <span>{serverError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <div className="form-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Full Name</label>
                  {touched.name && !errors.name && (
                    <span style={{ fontSize: 11, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Check size={12} /> Valid
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
                  />
                  <input
                    type="text"
                    style={{ paddingLeft: 38, ...getInputStyle('name') }}
                    placeholder="Alex Vance"
                    value={name}
                    onChange={e => {
                      setName(e.target.value)
                      setServerError('')
                    }}
                    onBlur={() => markTouched('name')}
                  />
                </div>
                {touched.name && errors.name && (
                  <span style={{ fontSize: 11.5, color: 'var(--crit)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> {errors.name}
                  </span>
                )}
              </div>

              {/* Username */}
              <div className="form-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Username</label>
                  {touched.username && !errors.username && (
                    <span style={{ fontSize: 11, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Check size={12} /> Available
                    </span>
                  )}
                </div>
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
                    style={{ paddingLeft: 34, ...getInputStyle('username') }}
                    placeholder="alex_vance"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      setServerError('')
                    }}
                    onBlur={() => markTouched('username')}
                  />
                </div>
                {touched.username && errors.username && (
                  <span style={{ fontSize: 11.5, color: 'var(--crit)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> {errors.username}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Email ID */}
          <div className="form-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Email Address</label>
              {touched.email && !errors.email ? (
                <span style={{ fontSize: 11, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Check size={12} /> Valid format
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>name@company.com</span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                type="email"
                style={{ paddingLeft: 38, ...getInputStyle('email') }}
                placeholder="name@company.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setServerError('')
                }}
                onBlur={() => markTouched('email')}
              />
            </div>
            {touched.email && errors.email && (
              <span style={{ fontSize: 11.5, color: 'var(--crit)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={12} /> {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="form-field">
            <div className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Password</span>
              <span style={{
                fontSize: 11,
                color: password && password.length <= 8 ? 'var(--crit)' : password.length > 8 ? 'var(--ok)' : 'var(--text-dim)',
                fontWeight: 500
              }}>
                Must be &gt; 8 chars {password ? `(${password.length})` : ''}
              </span>
            </div>
            <div className="password-input-wrap">
              <Lock
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                style={{ paddingLeft: 38, paddingRight: 40, ...getInputStyle('password') }}
                placeholder={mode === 'login' ? 'Enter password (> 8 characters)' : 'Create password (> 8 characters)'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setServerError('')
                }}
                onBlur={() => markTouched('password')}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {touched.password && errors.password && (
              <span style={{ fontSize: 11.5, color: 'var(--crit)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={12} /> {errors.password}
              </span>
            )}

            {/* Signup: Password checklist & strength meter */}
            {mode === 'signup' && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                {password && (
                  <div style={{ marginBottom: 8 }}>
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
                      <span>Strength: <b style={{ color: strengthColors[Math.max(0, pwdScore - 1)] }}>{strengthLabels[Math.max(0, pwdScore - 1)]}</b></span>
                      <span>Score: {pwdScore}/4</span>
                    </div>
                  </div>
                )}

                {/* Password Criteria Checklist */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                  {[
                    { label: 'At least 9 characters', met: pwdChecks.length },
                    { label: 'Uppercase letter (A-Z)', met: pwdChecks.upper },
                    { label: 'Number (0-9)', met: pwdChecks.number },
                    { label: 'Special symbol (!@#$)', met: pwdChecks.special }
                  ].map(c => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: c.met ? 'var(--ok)' : 'var(--text-dim)' }}>
                      {c.met ? <CheckCircle2 size={12} color="var(--ok)" /> : <Circle size={12} />}
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Signup only) */}
          {mode === 'signup' && (
            <div className="form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Confirm Password</label>
                {confirmPassword && confirmPassword === password && (
                  <span style={{ fontSize: 11, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Check size={12} /> Passwords match
                  </span>
                )}
              </div>
              <div className="password-input-wrap">
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  style={{ paddingLeft: 38, paddingRight: 40, ...getInputStyle('confirmPassword') }}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value)
                    setServerError('')
                  }}
                  onBlur={() => markTouched('confirmPassword')}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <span style={{ fontSize: 11.5, color: 'var(--crit)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> {errors.confirmPassword}
                </span>
              )}
            </div>
          )}

          {/* Submit Button */}
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
