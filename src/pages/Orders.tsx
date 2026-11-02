import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, PackageCheck } from 'lucide-react'
import { Link } from '../lib/nav'
import { useAuth } from '../lib/auth'
import { supabase, type FulfillmentStatus, type OrderRow } from '../lib/supabaseClient'
import { formatInr, PRODUCT } from '../lib/catalog'

const fulfillmentLabels: Record<FulfillmentStatus, string> = {
  processing: 'Preparing your order',
  shipped: 'On its way',
  completed: 'Delivered',
  cancelled: 'Cancelled',
}

function productName(productId: string) {
  const [id, edition] = productId.split(':')
  if (id !== PRODUCT.id) return productId
  return `${PRODUCT.name} · ${PRODUCT.editions[edition as keyof typeof PRODUCT.editions]?.name ?? edition}`
}

export function Orders() {
  const { session, loading } = useAuth()
  const [rows, setRows] = useState<OrderRow[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    let cancelled = false
    setRows(null)
    setError('')
    void (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
        if (cancelled) return
        if (fetchError) setError(fetchError.message)
        else setRows(data ?? [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your orders.')
      }
    })()
    return () => { cancelled = true }
  }, [session])

  const orders = useMemo(() => {
    if (!rows) return []
    const groups = new Map<string, OrderRow[]>()
    for (const row of rows) groups.set(row.checkout_id, [...(groups.get(row.checkout_id) ?? []), row])
    return [...groups.entries()].map(([checkoutId, items]) => ({
      checkoutId,
      date: items[0].created_at,
      items,
      total: items.reduce((sum, item) => sum + item.total_inr, 0),
      fulfillment: items[0].fulfillment_status,
      method: items[0].payment_method,
      payment: items[0].payment_status,
    }))
  }, [rows])

  if (loading) return <div className="orders-page"><p className="lede">Loading your orders…</p></div>
  if (!session) return <div className="orders-page"><span className="eyebrow">Your BOXPOX account</span><h1>Orders</h1><p className="lede">Log in to view order status, delivery details, and payment information.</p><Link to="/login" className="btn btn-buy">Log in <ArrowRight size={16}/></Link></div>

  return <div className="orders-page">
    <div className="orders-hero"><div><span className="eyebrow">Your BOXPOX account</span><h1>Orders</h1><p>Track your BOXDRIVE purchases and see the details of every order.</p></div><div className="orders-hero-icon"><PackageCheck size={34}/></div></div>
    {error && <p className="form-error">Could not load orders: {error}</p>}
    {!error && rows === null && <div className="orders-state"><span className="loader-dot"/><p>Loading your order history…</p></div>}
    {!error && rows && orders.length === 0 && <div className="orders-state orders-empty"><div className="orders-hero-icon"><PackageCheck size={30}/></div><h2>Your next build starts here.</h2><p>Your orders will appear here after checkout.</p><Link to="/product" className="btn btn-buy">Explore BOXDRIVE <ArrowRight size={16}/></Link></div>}
    {orders.length > 0 && <div className="orders-stack">{orders.map((order) => <article className="order-card order-card-featured" key={order.checkoutId}>
      <div className="order-card-head"><div><span className="order-kicker">Order reference</span><strong>BPX-{order.checkoutId.slice(0, 8).toUpperCase()}</strong><p>{new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div><span className={`status-badge fulfillment-${order.fulfillment}`}>{fulfillmentLabels[order.fulfillment]}</span></div>
      <div className="order-products">{order.items.map((item) => <div className="order-product" key={item.id}><img src="/real3.png" alt=""/><div><strong>{productName(item.product_id)}</strong><p>Quantity {item.quantity} · {formatInr(item.unit_price_inr)} each</p></div><b>{formatInr(item.total_inr)}</b></div>)}</div>
      <div className="order-card-foot"><div><span>Payment</span><strong>{order.method === 'cod' ? `Cash on delivery${order.payment === 'pending' ? ' · pending' : ''}` : order.payment === 'paid' ? 'Paid online' : order.payment}</strong></div><div><span>Order total</span><strong>{formatInr(order.total)}</strong></div></div>
    </article>)}</div>}
    <div className="orders-footer-link"><span>Need to update your details?</span><Link to="/account">Manage account <ArrowRight size={15}/></Link></div>
  </div>
}
