import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatInr } from '../lib/catalog'
import { useCart } from '../lib/cart'
import { Link } from '../lib/nav'

export function Cart() {
  const { items, total, setQty, remove } = useCart()

  if (items.length === 0) {
    return (
      <div className="narrow-page">
        <h1>Cart</h1>
        <p className="lede">Your cart is empty.</p>
        <Link to="/product" className="btn btn-buy">
          Shop BOXDRIVE
        </Link>
      </div>
    )
  }

  return (
    <div className="narrow-page">
      <h1>Cart</h1>
      <ul className="cart-list">
        {items.map((item) => (
          <li key={`${item.productId}-${item.edition}`} className="cart-row">
            <img src={item.image} alt="" />
            <div>
              <strong>{item.name}</strong>
              <p>{item.editionName}</p>
              <p>{formatInr(item.price)}</p>
            </div>
            <div className="qty">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQty(item.productId, item.edition, item.qty - 1)}
              >
                <Minus size={16} />
              </button>
              <span>{item.qty}</span>
              <button
                aria-label="Increase quantity"
                disabled={item.qty >= (item.maxQty ?? 10)}
                onClick={() => setQty(item.productId, item.edition, item.qty + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="icon-btn"
              aria-label="Remove item"
              onClick={() => remove(item.productId, item.edition)}
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
      <div className="cart-total">
        <span>Total</span>
        <strong>{formatInr(total)} <span style={{ fontSize: '0.6em', fontWeight: 'normal', opacity: 0.7 }}>(incl. GST)</span></strong>
      </div>
      <Link to="/checkout" className="btn btn-cart">
        Checkout
      </Link>
    </div>
  )
}
