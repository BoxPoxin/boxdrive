import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNav } from '../lib/nav'
import { useAuth } from '../lib/auth'
import { supabase, type FulfillmentStatus, type OrderRow } from '../lib/supabaseClient'
import { formatInr, PRODUCT } from '../lib/catalog'

type ProfileForm = {
  fullName: string
  phone: string
  shippingAddress: string
  shippingCity: string
  shippingPincode: string
  billingAddress: string
  billingCity: string
  billingPincode: string
  billingSameAsShipping: boolean
}

const emptyForm: ProfileForm = {
  fullName: '',
  phone: '',
  shippingAddress: '',
  shippingCity: '',
  shippingPincode: '',
  billingAddress: '',
  billingCity: '',
  billingPincode: '',
  billingSameAsShipping: true,
}

function productLabel(productId: string) {
  const [id, edition] = productId.split(':')
  if (id !== PRODUCT.id) return productId
  const editionName = PRODUCT.editions[edition as keyof typeof PRODUCT.editions]?.name ?? edition
  return `${PRODUCT.name} — ${editionName}`
}

const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

type GroupedOrder = {
  checkoutId: string
  createdAt: string
  paymentMethod: string
  paymentStatus: string
  fulfillmentStatus: FulfillmentStatus
  razorpayPaymentId: string | null
  total: number
  items: OrderRow[]
}

function groupOrders(rows: OrderRow[]): GroupedOrder[] {
  const byCheckout = new Map<string, OrderRow[]>()
  for (const row of rows) {
    const list = byCheckout.get(row.checkout_id) ?? []
    list.push(row)
    byCheckout.set(row.checkout_id, list)
  }
  return Array.from(byCheckout.entries())
    .map(([checkoutId, items]) => ({
      checkoutId,
      createdAt: items[0].created_at,
      paymentMethod: items[0].payment_method,
      paymentStatus: items[0].payment_status,
      fulfillmentStatus: items[0].fulfillment_status,
      razorpayPaymentId: items[0].razorpay_payment_id,
      total: items.reduce((sum, item) => sum + item.total_inr, 0),
      items,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function Account() {
  const { session, profile, loading, logOut, updateProfile } = useAuth()
  const { navigate } = useNav()
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [ordersError, setOrdersError] = useState('')

  useEffect(() => {
    if (!profile) return
    setForm({
      fullName: profile.full_name,
      phone: profile.phone,
      shippingAddress: profile.shipping_address,
      shippingCity: profile.shipping_city,
      shippingPincode: profile.shipping_pincode,
      billingAddress: profile.billing_address,
      billingCity: profile.billing_city,
      billingPincode: profile.billing_pincode,
      billingSameAsShipping: profile.billing_same_as_shipping,
    })
  }, [profile])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    setOrders(null)
    setOrdersError('')
    ;(async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
        if (cancelled) return
        if (fetchError) {
          setOrdersError(fetchError.message)
          return
        }
        setOrders(data ?? [])
      } catch (err) {
        if (cancelled) return
        setOrdersError(err instanceof Error ? err.message : 'Could not load orders.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session, profile])

  const groupedOrders = useMemo(() => (orders ? groupOrders(orders) : []), [orders])

  const set = (key: keyof ProfileForm) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!form.fullName.trim() || form.phone.replace(/\D/g, '').length < 10) {
      setError('Add your name and a valid 10-digit phone number.')
      return
    }
    if (!form.shippingAddress.trim() || !form.shippingCity.trim() || form.shippingPincode.replace(/\D/g, '').length < 6) {
      setError('Add a full shipping address and 6-digit PIN code.')
      return
    }
    if (
      !form.billingSameAsShipping &&
      (!form.billingAddress.trim() || !form.billingCity.trim() || form.billingPincode.replace(/\D/g, '').length < 6)
    ) {
      setError('Add a full billing address and 6-digit PIN code, or mark it same as shipping.')
      return
    }

    setSaving(true)
    try {
      await updateProfile({
        ...form,
        billingAddress: form.billingSameAsShipping ? form.shippingAddress : form.billingAddress,
        billingCity: form.billingSameAsShipping ? form.shippingCity : form.billingCity,
        billingPincode: form.billingSameAsShipping ? form.shippingPincode : form.billingPincode,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="narrow-page">
        <p className="lede">Loading your account…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="narrow-page">
        <h1>My account</h1>
        <p className="lede">Log in to manage your details and see past orders.</p>
        <Link to="/login" className="btn btn-buy">
          Log in
        </Link>
      </div>
    )
  }

  return (
    <div className="narrow-page">
      <h1>My account</h1>
      <p className="lede">{session.user.email}</p>

      <form className="checkout-form" onSubmit={onSubmit}>
        <h2>Profile</h2>
        <label>
          Full name
          <input value={form.fullName} onChange={set('fullName')} autoComplete="name" required />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={set('phone')} autoComplete="tel" required />
        </label>

        <h2>Shipping address</h2>
        <label>
          Address
          <textarea value={form.shippingAddress} onChange={set('shippingAddress')} required rows={3} />
        </label>
        <div className="form-split">
          <label>
            City
            <input value={form.shippingCity} onChange={set('shippingCity')} required />
          </label>
          <label>
            PIN code
            <input value={form.shippingPincode} onChange={set('shippingPincode')} required />
          </label>
        </div>

        <h2>Billing address</h2>
        <label className="radio">
          <input
            type="checkbox"
            checked={form.billingSameAsShipping}
            onChange={(e) => setForm((prev) => ({ ...prev, billingSameAsShipping: e.target.checked }))}
          />
          Same as shipping address
        </label>
        {!form.billingSameAsShipping && (
          <>
            <label>
              Address
              <textarea value={form.billingAddress} onChange={set('billingAddress')} required rows={3} />
            </label>
            <div className="form-split">
              <label>
                City
                <input value={form.billingCity} onChange={set('billingCity')} required />
              </label>
              <label>
                PIN code
                <input value={form.billingPincode} onChange={set('billingPincode')} required />
              </label>
            </div>
          </>
        )}

        {error && <p className="form-error">{error}</p>}
        {saved && <p className="muted">Saved.</p>}
        <button type="submit" className="btn btn-cart" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <h2 className="account-section-heading">Past orders</h2>
      {ordersError && <p className="form-error">{ordersError}</p>}
      {!ordersError && orders === null && <p className="muted">Loading orders…</p>}
      {orders !== null && groupedOrders.length === 0 && <p className="muted">No orders yet.</p>}
      {groupedOrders.length > 0 && (
        <ul className="order-list">
          {groupedOrders.map((order) => (
            <li key={order.checkoutId} className="order-card">
              <div className="order-card-head">
                <div>
                  <strong>Order BPX-{order.checkoutId.slice(0, 8).toUpperCase()}</strong>
                  <p className="muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="order-badges">
                  <span className={`status-badge fulfillment-${order.fulfillmentStatus}`}>
                    {FULFILLMENT_LABELS[order.fulfillmentStatus]}
                  </span>
                  <span className={`status-badge payment-${order.paymentStatus}`}>
                    {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid'}
                    {order.paymentStatus === 'pending' && order.paymentMethod === 'cod' ? ' · pending' : ''}
                  </span>
                </div>
              </div>
              <p>{order.items.map((item) => `${productLabel(item.product_id)} × ${item.quantity}`).join(', ')}</p>
              {order.razorpayPaymentId && <p className="muted">Payment ref {order.razorpayPaymentId}</p>}
              <p className="order-total">{formatInr(order.total)}</p>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="btn btn-buy"
        onClick={() => {
          void logOut()
          navigate('/')
        }}
      >
        Log out
      </button>
    </div>
  )
}
