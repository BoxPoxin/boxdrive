import crypto from 'node:crypto'
import { notifyAdminOfOrder } from './notifications.js'
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from './mailer.js'

/**
 * @typedef {object} OrderLineItem
 * @property {string} product_id
 * @property {number} quantity
 * @property {number} unit_price_inr
 *
 * @typedef {object} ShippingDetails
 * @property {string} name
 * @property {string} phone
 * @property {string} address
 * @property {string} city
 * @property {string} pincode
 * @property {string} [companyName]
 * @property {string} [gstNumber]
 * @property {string} [email]
 *
 * @typedef {object} RecordOrderInput
 * @property {string|null} userId
 * @property {OrderLineItem[]} items
 * @property {ShippingDetails} shipping
 * @property {'razorpay'|'cod'} paymentMethod
 * @property {'pending'|'paid'} paymentStatus
 * @property {string|null} [razorpayOrderId]
 * @property {string|null} [razorpayPaymentId]
 */

/**
 * Inserts one `orders` row per cart line item (sharing a `checkout_id`).
 * The insert on `orders` fires the `decrement_product_stock` Postgres trigger,
 * which atomically reduces `products.stock_quantity` for each line item.
 * Uses the Supabase service-role client, so RLS is bypassed (guest checkouts included).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {RecordOrderInput} input
 */
export async function recordOrder(supabase, input) {
  const checkoutId = crypto.randomUUID()

  const rows = input.items.map((item) => ({
    checkout_id: checkoutId,
    user_id: input.userId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price_inr: item.unit_price_inr,
    total_inr: item.unit_price_inr * item.quantity,
    currency: 'INR',
    payment_method: input.paymentMethod,
    payment_status: input.paymentStatus,
    razorpay_order_id: input.razorpayOrderId ?? null,
    razorpay_payment_id: input.razorpayPaymentId ?? null,
    shipping_name: input.shipping.name,
    shipping_phone: input.shipping.phone,
    shipping_address: input.shipping.address,
    shipping_city: input.shipping.city,
    shipping_pincode: input.shipping.pincode,
    shipping_email: input.shipping.email ?? null,
    company_name: input.shipping.companyName ?? null,
    gst_number: input.shipping.gstNumber ?? null,
  }))

  const { error } = await supabase.from('orders').insert(rows)
  if (error) throw error

  const totalInr = rows.reduce((sum, row) => sum + row.total_inr, 0)
  const orderDetails = {
    checkoutId,
    paymentMethod: input.paymentMethod,
    razorpayPaymentId: input.razorpayPaymentId ?? null,
    totalInr,
    items: input.items,
    shipping: input.shipping,
  }

  await notifyAdminOfOrder(orderDetails)
  await sendAdminOrderNotificationEmail(orderDetails)

  if (input.shipping.email) {
    const formattedOrderId = `BPX-${checkoutId.slice(0, 8).toUpperCase()}`
    await sendOrderConfirmationEmail({
      ...orderDetails,
      orderId: formattedOrderId,
      name: input.shipping.name,
      email: input.shipping.email
    })
  }

  return { checkoutId }
}
