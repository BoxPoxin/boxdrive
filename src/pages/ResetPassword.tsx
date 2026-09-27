import { useState, type FormEvent } from 'react'
import { Link, useNav } from '../lib/nav'
import { useAuth } from '../lib/auth'

export function ResetPassword() {
  const { session, updatePassword } = useAuth()
  const { navigate } = useNav()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await updatePassword(password)
      setDone(true)
      window.setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="narrow-page">
        <h1>Password updated</h1>
        <p className="lede">Redirecting you home…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="narrow-page">
        <h1>Reset link expired</h1>
        <p className="lede">Open the password reset link from your email again, or request a new one.</p>
        <Link to="/forgot-password" className="btn btn-buy">
          Request new link
        </Link>
      </div>
    )
  }

  return (
    <div className="narrow-page">
      <h1>Set a new password</h1>
      <form className="checkout-form" onSubmit={onSubmit}>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-cart" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
