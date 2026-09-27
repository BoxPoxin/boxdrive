export type RazorpayHandlerResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: RazorpayHandlerResponse) => void
  modal?: { ondismiss?: () => void }
}

type RazorpayFailureResponse = {
  error: { description?: string; code?: string; reason?: string }
}

export type RazorpayInstance = {
  open: () => void
  on: (event: 'payment.failed', handler: (response: RazorpayFailureResponse) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

async function apiJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Request failed')
  }
  return data as T
}

export function createOrder(amountRupees: number, receipt: string) {
  return apiJson<{ order_id: string; amount: number; currency: string }>('/api/create-order', {
    amount: Math.round(amountRupees * 100),
    currency: 'INR',
    receipt,
  })
}

export interface OrderLineItem {
  product_id: string
  quantity: number
  unit_price_inr: number
}

export interface ShippingDetails {
  name: string
  email?: string
  phone: string
  address: string
  city: string
  pincode: string
}

export interface VerifyPaymentPayload extends RazorpayHandlerResponse {
  user_id: string | null
  items: OrderLineItem[]
  shipping: ShippingDetails
}

export function verifyPayment(payload: VerifyPaymentPayload) {
  return apiJson<{ success: boolean; checkoutId?: string; error?: string }>('/api/verify-payment', payload)
}

export interface PlaceCodOrderPayload {
  user_id: string | null
  items: OrderLineItem[]
  shipping: ShippingDetails
}

export function placeCodOrder(payload: PlaceCodOrderPayload) {
  return apiJson<{ success: boolean; checkoutId?: string; error?: string }>('/api/orders/cod', payload)
}

export function openRazorpayCheckout(options: RazorpayOptions, onFail?: (message: string) => void) {
  if (!window.Razorpay) {
    throw new Error('Payment gateway failed to load. Check your connection and try again.')
  }
  const instance = new window.Razorpay(options)
  instance.on('payment.failed', (response) => {
    onFail?.(response.error?.description || 'Payment failed. Please try again.')
  })
  instance.open()
}
