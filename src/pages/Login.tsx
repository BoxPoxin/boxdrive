import { useState, type FormEvent } from 'react'
import { Link, useNav } from '../lib/nav'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'

export function Login() {
  const { logIn, resendConfirmation } = useAuth()
  const { navigate } = useNav()
  const cart = useCart()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [resent, setResent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setUnconfirmed(false)
    setResent(false)
    if (!email.includes('@') || password.length < 1) {
      setError('Enter your email and password.')
      return
    }
    setSubmitting(true)
    try {
      await logIn({ email, password })
      if (cart.items.length > 0) {
        navigate('/checkout')
      } else {
        navigate('/')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Log in failed. Try again.'
      setError(message)
      if (message.toLowerCase().includes('email not confirmed')) setUnconfirmed(true)
    } finally {
      setSubmitting(false)
    }
  }

  const onResend = async () => {
    setError('')
    try {
      await resendConfirmation(email)
      setResent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend confirmation email.')
    }
  }

  return (
    <div className="narrow-page">
      <h1>Log in</h1>
      <form className="checkout-form" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        {unconfirmed && !resent && (
          <button type="button" className="account-link" onClick={onResend}>
            Resend confirmation email
          </button>
        )}
        {resent && <p className="muted">Confirmation email sent. Check your inbox.</p>}
        <button type="submit" className="btn btn-cart" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="muted">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
      <p className="muted">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  )
}
