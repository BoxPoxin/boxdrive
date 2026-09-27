import { useState, type FormEvent } from 'react'
import { Link } from '../lib/nav'
import { useAuth } from '../lib/auth'

export function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) {
      setError('Enter a valid email.')
      return
    }
    setSubmitting(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="narrow-page">
        <h1>Check your email</h1>
        <p className="lede">We sent a password reset link to {email}.</p>
        <Link to="/login" className="btn btn-buy">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <div className="narrow-page">
      <h1>Reset your password</h1>
      <p className="lede">We&apos;ll email you a link to set a new password.</p>
      <form className="checkout-form" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-cart" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="muted">
        Remembered it? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
