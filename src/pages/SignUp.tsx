import { useState, type FormEvent } from 'react'
import { Link, useNav } from '../lib/nav'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'

type FormState = {
  fullName: string
  email: string
  password: string
  phone: string
  address: string
  city: string
  pincode: string
}

const empty: FormState = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
}

export function SignUp() {
  const { signUp } = useAuth()
  const { navigate } = useNav()
  const cart = useCart()
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const set = (key: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.fullName.trim() || !form.email.includes('@') || form.password.length < 6) {
      setError('Add your name, a valid email and a password (6+ characters).')
      return
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      setError('Add a valid 10-digit phone number.')
      return
    }
    if (!form.address.trim() || !form.city.trim() || form.pincode.replace(/\D/g, '').length < 6) {
      setError('Add a full shipping address and 6-digit PIN code.')
      return
    }

    setSubmitting(true)
    try {
      const { needsEmailConfirmation } = await signUp(form)
      if (needsEmailConfirmation) {
        setConfirmationSent(true)
      } else if (cart.items.length > 0) {
        navigate('/checkout')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="narrow-page">
        <h1>Confirm your email</h1>
        <p className="lede">
          We sent a confirmation link to {form.email}. Click it to activate your account, then log in.
        </p>
        <Link to="/login" className="btn btn-buy">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <div className="narrow-page">
      <h1>Create an account</h1>
      <p className="lede">Save your shipping address for faster checkout.</p>
      <form className="checkout-form" onSubmit={onSubmit}>
        <label>
          Full name
          <input value={form.fullName} onChange={set('fullName')} autoComplete="name" required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={set('phone')} autoComplete="tel" required />
        </label>
        <label>
          Address
          <textarea value={form.address} onChange={set('address')} required rows={3} />
        </label>
        <div className="form-split">
          <label>
            City
            <input value={form.city} onChange={set('city')} required />
          </label>
          <label>
            PIN code
            <input value={form.pincode} onChange={set('pincode')} required />
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-cart" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
