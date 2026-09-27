const TELEGRAM_API = 'https://api.telegram.org'

/**
 * @typedef {object} OrderAlertDetails
 * @property {string} checkoutId
 * @property {'razorpay'|'cod'} paymentMethod
 * @property {string|null} razorpayPaymentId
 * @property {number} totalInr
 * @property {{ product_id: string, quantity: number, unit_price_inr: number }[]} items
 * @property {{ name: string, phone: string, address: string, city: string, pincode: string }} shipping
 */

/**
 * Sends a Telegram message to the configured admin chat when a new order is recorded.
 * No-op (with a console warning) if TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set,
 * so a missing notification channel never blocks order processing.
 * @param {OrderAlertDetails} order
 */
export async function notifyAdminOfOrder(order) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env
  const chatId = TELEGRAM_CHAT_ID?.trim()

  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    console.warn('Telegram admin alert skipped: set TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID in website/.env')
    return
  }

  if (!/^[-]?\d+$/.test(chatId)) {
    console.warn('Telegram admin alert skipped: TELEGRAM_CHAT_ID must be a numeric chat ID, not a bot username.')
    return
  }

  const itemLines = order.items
    .map((item) => `• ${item.product_id} × ${item.quantity} (₹${item.unit_price_inr}/unit)`)
    .join('\n')

  const displayId = `BPX-${order.checkoutId.slice(0, 8).toUpperCase()}`
  const text = [
    '🛒 *New order received*',
    `Order ID: \`${displayId}\``,
    `Payment: ${order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Razorpay'}${order.razorpayPaymentId ? ` (\`${order.razorpayPaymentId}\`)` : ''}`,
    `Total: ₹${order.totalInr}`,
    '',
    '*Items*',
    itemLines,
    '',
    '*Ship to*',
    order.shipping.name,
    order.shipping.phone,
    order.shipping.address,
    `${order.shipping.city} - ${order.shipping.pincode}`,
  ].join('\n')

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    })
    if (!res.ok) {
      console.error('Telegram alert failed:', await res.text())
    }
  } catch (err) {
    console.error('Telegram alert error:', err)
  }
}
