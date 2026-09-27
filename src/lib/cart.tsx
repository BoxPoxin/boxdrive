import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { itemKey, type CartItem, type EditionId } from './catalog'

const STORAGE_KEY = 'boxpox-cart'
const ORDER_KEY = 'boxpox-last-order'

type CartContextValue = {
  items: CartItem[]
  count: number
  total: number
  add: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void
  setQty: (productId: string, edition: EditionId, qty: number) => void
  remove: (productId: string, edition: EditionId) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export type PlacedOrder = {
  id: string
  createdAt: string
  items: CartItem[]
  total: number
  customer: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    pincode: string
    companyName?: string
    gstNumber?: string
    payment: 'cod' | 'razorpay'
  }
  razorpayPaymentId?: string
}

export function saveOrder(order: PlacedOrder) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(order))
}

export function loadLastOrder(): PlacedOrder | null {
  try {
    const raw = localStorage.getItem(ORDER_KEY)
    return raw ? (JSON.parse(raw) as PlacedOrder) : null
  } catch {
    return null
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add: CartContextValue['add'] = useCallback((item) => {
    setItems((prev) => {
      const key = itemKey(item)
      const existing = prev.find((row) => itemKey(row) === key)
      const qty = item.qty ?? 1
      const maxQty = item.maxQty ?? 10
      if (existing) {
        return prev.map((row) =>
          itemKey(row) === key ? { ...row, qty: Math.min(maxQty, row.qty + qty), maxQty } : row,
        )
      }
      return [...prev, { ...item, qty, maxQty }]
    })
  }, [])

  const setQty: CartContextValue['setQty'] = useCallback((productId, edition, qty) => {
    setItems((prev) =>
      prev
        .map((row) => (row.productId === productId && row.edition === edition ? { ...row, qty: Math.min(row.maxQty ?? 10, qty) } : row))
        .filter((row) => row.qty > 0),
    )
  }, [])

  const remove: CartContextValue['remove'] = useCallback((productId, edition) => {
    setItems((prev) => prev.filter((row) => !(row.productId === productId && row.edition === edition)))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const count = items.reduce((sum, row) => sum + row.qty, 0)
    const total = items.reduce((sum, row) => sum + row.price * row.qty, 0)
    return { items, count, total, add, setQty, remove, clear }
  }, [items, add, setQty, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
