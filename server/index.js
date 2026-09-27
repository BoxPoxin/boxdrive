import 'dotenv/config'
import crypto from 'node:crypto'
import cors from 'cors'
import express from 'express'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { recordOrder } from './orders.js'

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  PORT = 8787,
} = process.env

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error('Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET — add them to website/.env')
  process.exit(1)
}

const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null

const MIN_AMOUNT_PAISE = 100

const app = express()
app.use(cors())
app.use(express.json())

app.post('/api/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body ?? {}

  if (!Number.isInteger(amount) || amount < MIN_AMOUNT_PAISE) {
    return res.status(400).json({ error: `amount must be an integer >= ${MIN_AMOUNT_PAISE} paise` })
  }

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    })
    res.json({ order_id: order.id, amount: order.amount, currency: order.currency })
  } catch (err) {
    const status = err?.statusCode === 401 ? 401 : 500
    console.error('create-order failed:', err?.error ?? err)
    res.status(status).json({ error: 'Unable to create Razorpay order' })
  }
})

app.post('/api/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, items, shipping } = req.body ?? {}

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Missing payment fields' })
  }

  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  const expectedBuf = Buffer.from(expected)
  const givenBuf = Buffer.from(razorpay_signature)
  const valid = expectedBuf.length === givenBuf.length && crypto.timingSafeEqual(expectedBuf, givenBuf)

  if (!valid) {
    return res.status(400).json({ success: false, error: 'Signature verification failed' })
  }

  if (supabase && Array.isArray(items) && items.length > 0 && shipping) {
    try {
      const { checkoutId } = await recordOrder(supabase, {
        userId: user_id ?? null,
        items,
        shipping,
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      })
      return res.json({ success: true, checkoutId })
    } catch (err) {
      console.error('Order recording failed:', err)
      // Payment is already verified — surface success to the shopper, but log for follow-up.
    }
  }

  res.json({ success: true })
})

app.post('/api/orders/cod', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to website/.env',
    })
  }

  const { user_id, items, shipping } = req.body ?? {}

  if (!Array.isArray(items) || items.length === 0 || !shipping) {
    return res.status(400).json({ success: false, error: 'Missing order items or shipping details' })
  }

  try {
    const { checkoutId } = await recordOrder(supabase, {
      userId: user_id ?? null,
      items,
      shipping,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
    })
    res.json({ success: true, checkoutId })
  } catch (err) {
    console.error('COD order recording failed:', err)
    res.status(500).json({ success: false, error: 'Could not place order. Try again.' })
  }
})

import { sendOrderStatusEmail } from './mailer.js'

app.post('/api/webhooks/supabase', async (req, res) => {
  const payload = req.body
  
  // Only listen for UPDATE events on the orders table
  if (payload.type === 'UPDATE' && payload.table === 'orders') {
    const oldRow = payload.old_record
    const newRow = payload.record

    // If fulfillment_status changed, send an email
    if (oldRow && newRow && oldRow.fulfillment_status !== newRow.fulfillment_status) {
      const email = newRow.shipping_email || null
      if (email) {
        await sendOrderStatusEmail({
          email: email,
          name: newRow.shipping_name,
          orderId: newRow.checkout_id,
          status: newRow.fulfillment_status
        })
      }
    }
  }

  res.json({ success: true })
})

app.listen(PORT, () => console.log(`Razorpay API server listening on http://localhost:${PORT}`))
