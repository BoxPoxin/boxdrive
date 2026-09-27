import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { formatInr, itemKey } from '../lib/catalog'
import { loadLastOrder, saveOrder, useCart, type PlacedOrder } from '../lib/cart'
import { Link, useNav } from '../lib/nav'
import { createOrder, openRazorpayCheckout, verifyPayment } from '../lib/razorpay'
import { useAuth } from '../lib/auth'

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined

type FormState = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  pincode: string
  companyName: string
  gstNumber: string
  payment: 'razorpay'
}

const empty: FormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
  companyName: '',
  gstNumber: '',
  payment: 'razorpay',
}

export function Checkout() {
  const cart = useCart()
  const { session, profile, updateProfile } = useAuth()
  const { path, navigate } = useNav()
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const lastOrder = useMemo(() => loadLastOrder(), [path])
  // Track whether the profile has already been applied so we don't
  // overwrite user-typed values on re-renders.
  const profileAppliedRef = useRef(false)

  useEffect(() => {
    if (!profile || !session) return
    // Only auto-fill once when the profile first arrives.
    if (profileAppliedRef.current) return
    profileAppliedRef.current = true
    setForm({
      name: profile.full_name || '',
      email: session.user.email || '',
      phone: profile.phone || '',
      address: profile.shipping_address || '',
      city: profile.shipping_city || '',
      pincode: profile.shipping_pincode || '',
      companyName: '',
      gstNumber: '',
      payment: 'razorpay',
    })
  }, [profile, session])

  const hasSavedAddress = Boolean(
    profile && profile.shipping_address && profile.shipping_city && profile.shipping_pincode,
  )
  const useSavedAddress = hasSavedAddress && !editingAddress

  if (path === '/order') {
    if (!lastOrder) {
      return (
        <div className="narrow-page">
          <h1>No order found</h1>
          <Link to="/product" className="btn btn-buy">
            Back to shop
          </Link>
        </div>
      )
    }
    return (
      <div className="narrow-page">
        <p className="eyebrow">Order confirmed</p>
        <h1>Thanks for your order.</h1>
        <p className="lede">
          {lastOrder.id} · {lastOrder.customer.name} · {formatInr(lastOrder.total)}
        </p>
        <ul className="cart-list">
          {lastOrder.items.map((item) => (
            <li key={`${item.productId}-${item.edition}`} className="cart-row">
              <img src={item.image} alt="" />
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.editionName} × {item.qty}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="muted">
          {lastOrder.customer.payment === 'cod'
            ? 'Pay cash on delivery when your order ships.'
            : `Payment received via Razorpay${lastOrder.razorpayPaymentId ? ` (ref ${lastOrder.razorpayPaymentId})` : ''}. We'll email you when your order ships.`}
        </p>
        <Link to="/" className="btn btn-buy">
          Back home
        </Link>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="narrow-page">
        <h1>Checkout</h1>
        <p className="lede">Your cart is empty.</p>
        <Link to="/product" className="btn btn-buy">
          Shop BOXDRIVE
        </Link>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="narrow-page">
        <p className="eyebrow">ACCOUNT REQUIRED</p>
        <h1>SIGN IN TO CHECKOUT</h1>
        <p className="lede">Please sign in or create an account to complete your purchase and track your order.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn btn-buy">
            Sign In
          </Link>
          <Link to="/signup" className="btn btn-cart">
            Create Account
          </Link>
        </div>
      </div>
    )
  }

  const validate = () => {
    if (!form.name.trim() || !form.email.includes('@') || form.phone.replace(/\D/g, '').length < 10) {
      setError('Add a valid name, email and 10-digit phone number.')
      return false
    }
    if (!form.address.trim() || !form.city.trim() || form.pincode.replace(/\D/g, '').length < 6) {
      setError('Add a full shipping address and 6-digit PIN code.')
      return false
    }
    return true
  }

  const finalizeOrder = async (checkoutId?: string, extra?: { razorpayPaymentId?: string }) => {
    const order: PlacedOrder = {
      id: checkoutId ? `BPX-${checkoutId.slice(0, 8).toUpperCase()}` : `BPX-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      items: cart.items,
      total: cart.total,
      customer: form,
      razorpayPaymentId: extra?.razorpayPaymentId,
    }


    // Persist the shipping details back to the user's profile so the
    // address is pre-filled on the next checkout.
    if (session && updateProfile) {
      try {
        await updateProfile({
          fullName: form.name,
          phone: form.phone,
          shippingAddress: form.address,
          shippingCity: form.city,
          shippingPincode: form.pincode,
          billingAddress: form.address,
          billingCity: form.city,
          billingPincode: form.pincode,
          billingSameAsShipping: true,
        })
      } catch (err) {
        // Non-critical — the order still went through.
        console.warn('Profile address save failed:', err)
      }
    }

    saveOrder(order)
    cart.clear()
    navigate('/order')
  }

  const payWithRazorpay = async () => {
    if (!RAZORPAY_KEY_ID) {
      setError('Payment gateway is not configured. Set VITE_RAZORPAY_KEY_ID in website/.env.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const { order_id, amount, currency } = await createOrder(cart.total, `chk_${Date.now()}`)
      openRazorpayCheckout(
        {
          key: RAZORPAY_KEY_ID,
          amount,
          currency,
          name: 'BOXPOX',
          description: 'BOXDRIVE',
          order_id,
          prefill: { name: form.name, email: form.email, contact: form.phone },
          theme: { color: '#111111' },
          handler: async (response) => {
            try {
              const result = await verifyPayment({
                ...response,
                user_id: session?.user.id ?? null,
                items: cart.items.map((item) => ({
                  product_id: itemKey(item),
                  quantity: item.qty,
                  unit_price_inr: item.price,
                })),
                shipping: {
                  name: form.name,
                  email: form.email,
                  phone: form.phone,
                  address: form.address,
                  city: form.city,
                  pincode: form.pincode,
                  companyName: form.companyName,
                  gstNumber: form.gstNumber,
                },
              })
              if (!result.success) {
                setError('Payment verification failed. If money was deducted, contact support.')
                setSubmitting(false)
                return
              }
              await finalizeOrder(result.checkoutId, { razorpayPaymentId: response.razorpay_payment_id })
            } catch {
              setError('Could not verify payment. If money was deducted, contact support.')
              setSubmitting(false)
            }
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false)
              setError('Payment cancelled.')
            },
          },
        },
        (message) => {
          setError(message)
          setSubmitting(false)
        },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start payment. Try again.')
      setSubmitting(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    void payWithRazorpay()
  }

  const set = (key: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const onPincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value
    setForm((prev) => ({ ...prev, pincode: pin }))
    
    if (pin.length === 6 && /^\d+$/.test(pin)) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
        const data = await res.json()
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0]
          // The API returns District and State
          setForm((prev) => ({ ...prev, city: `${po.District}, ${po.State}` }))
        }
      } catch (err) {
        // silently ignore fetch errors
      }
    }
  }

  return (
    <div className="narrow-page">
      <h1>Checkout</h1>
      <p className="lede">Total {formatInr(cart.total)} (incl. GST) · ships in 2–3 business days</p>
      <form className="checkout-form" onSubmit={onSubmit}>
        {useSavedAddress ? (
          <div className="saved-address-card">
            <p>
              <strong>{form.name}</strong>
            </p>
            <p className="muted">
              {form.phone} · {form.email}
            </p>
            <p className="muted">
              {form.address}, {form.city} - {form.pincode}
            </p>
            <button type="button" className="account-link" onClick={() => setEditingAddress(true)}>
              Use a different address
            </button>
          </div>
        ) : (
          <>
            <label>
              Full name
              <input value={form.name} onChange={set('name')} autoComplete="name" required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={set('phone')} autoComplete="tel" required />
            </label>
            <div className="form-split">
              <label>
                Company Name (Optional)
                <input value={form.companyName} onChange={set('companyName')} />
              </label>
              <label>
                GST Number (Optional)
                <input value={form.gstNumber} onChange={set('gstNumber')} />
              </label>
            </div>
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
                <input value={form.pincode} onChange={onPincodeChange} required />
              </label>
            </div>
            {hasSavedAddress && (
              <button type="button" className="account-link" onClick={() => {
                // Restore form fields from the saved profile
                if (profile && session) {
                  setForm((prev) => ({
                    ...prev,
                    name: profile.full_name || prev.name,
                    email: session.user.email || prev.email,
                    phone: profile.phone || prev.phone,
                    address: profile.shipping_address,
                    city: profile.shipping_city,
                    pincode: profile.shipping_pincode,
                  }))
                }
                setEditingAddress(false)
              }}>
                Use my saved address
              </button>
            )}
          </>
        )}
        <div className="payment-method-info">
          <p className="muted" style={{ margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>
            ⚡ Payment: Cards, UPI, Netbanking (Secured by Razorpay)
          </p>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-cart" disabled={submitting}>
          {submitting ? 'Processing…' : `Pay ${formatInr(cart.total)} (incl. GST)`}
        </button>
      </form>
    </div>
  )
}
