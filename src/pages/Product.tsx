import { useEffect, useState } from 'react'
import { Check, Minus, Plus, ShieldCheck, Truck } from 'lucide-react'
import { PRODUCT, formatInr, itemKey } from '../lib/catalog'
import { useCart } from '../lib/cart'
import { Link } from '../lib/nav'
import { supabase } from '../lib/supabaseClient'

const faqs = [
  {
    q: 'What can I actually build with BOXDRIVE?',
    a: 'Anything that needs precise, silent NEMA 17 motion — robotic arms, CNC axes, camera sliders, plotters and custom automation. Closed-loop control means the machine knows where the shaft really is.',
  },
  {
    q: 'Do I need to know programming?',
    a: 'Firmware knowledge helps for custom motion, but the board comes ready to flash like any ESP32. A web UI over Wi-Fi is included for first-run control.',
  },
  {
    q: 'Which programming environments are supported?',
    a: 'Arduino IDE, PlatformIO or ESP-IDF — anything in the ESP32-C6 ecosystem.',
  },
  {
    q: 'Is it truly silent?',
    a: 'Yes. The TMC2209 StealthChop path keeps the motor quiet even under load. SpreadCycle is there when you need more torque at speed.',
  },
  {
    q: 'Do I need to solder anything?',
    a: 'No. Mount it on a NEMA 17, glue the included magnet to the shaft, plug in XT30 power and USB-C. GPIO and CAN are there when you want to go deeper.',
  },
]

export function Product() {
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [added, setAdded] = useState(false)
  const [imgFade, setImgFade] = useState(false)
  const [stock, setStock] = useState<number | null>(null)
  const cart = useCart()
  const selected = PRODUCT.editions.standard
  const image = PRODUCT.images[active]

  useEffect(() => {
    if (!added) return
    const t = window.setTimeout(() => setAdded(false), 1800)
    return () => window.clearTimeout(t)
  }, [added])

  useEffect(() => {
    let cancelled = false
    supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', itemKey({ productId: PRODUCT.id, edition: selected.id }))
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setStock(data?.stock_quantity ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [selected.id])

  const maxQty = stock !== null ? Math.max(0, Math.min(10, stock)) : 10
  const outOfStock = stock !== null && stock <= 0

  const switchImage = (index: number) => {
    if (index === active) return
    setImgFade(true)
    setTimeout(() => {
      setActive(index)
      setImgFade(false)
    }, 150)
  }

  const addToCart = () => {
    cart.add({
      productId: PRODUCT.id,
      name: PRODUCT.name,
      edition: selected.id,
      editionName: selected.name,
      price: selected.price,
      qty,
      image: PRODUCT.images[0].src,
    })
    setAdded(true)
  }

  return (
    <div className="product-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>/</span>
        <Link to="/product">Shop</Link>
        <span aria-hidden>/</span>
        <strong>BOXDRIVE</strong>
      </nav>

      <div className="product-grid">
        {/* Left column — Gallery */}
        <div className="product-gallery-col">
          <div className="gallery-main reveal">
            <img
              src={image.src}
              alt={image.alt}
              className={image.invert ? 'invert-on-cream' : undefined}
              style={{ opacity: imgFade ? 0.4 : 1, transform: imgFade ? 'scale(.97)' : 'scale(1)' }}
            />
          </div>
          <div className="thumbs reveal">
            {PRODUCT.images.map((img, i) => (
              <button
                key={img.src}
                className={i === active ? 'thumb active' : 'thumb'}
                onClick={() => switchImage(i)}
                aria-label={`View image ${i + 1} of ${PRODUCT.images.length}`}
              >
                <img
                  src={img.src}
                  alt=""
                  className={img.invert ? 'invert-on-cream' : undefined}
                  loading="lazy"
                />
              </button>
            ))}
          </div>

        </div>

        {/* Right column — Sticky buy panel */}
        <aside className="buy-panel reveal">
          <h1>{PRODUCT.name}</h1>
          <p className="muted">{PRODUCT.tagline}</p>

          <div className="price-row">
            <div className="price">{formatInr(selected.price * qty)} <span style={{ fontSize: '0.4em', fontWeight: 'normal', opacity: 0.7, marginLeft: '0.5rem' }}>(incl. GST)</span></div>
            <div className="qty">
              <button
                aria-label="Decrease quantity"
                disabled={qty <= 1}
                onClick={() => setQty((n) => Math.max(1, n - 1))}
              >
                <Minus size={15} />
              </button>
              <span>{qty}</span>
              <button
                aria-label="Increase quantity"
                disabled={qty >= maxQty}
                onClick={() => setQty((n) => Math.min(maxQty, n + 1))}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <button className="btn btn-cart" onClick={addToCart} disabled={outOfStock}>
            {outOfStock ? (
              'Out of stock'
            ) : added ? (
              <>
                <Check size={17} /> Added to cart
              </>
            ) : (
              'Add to cart'
            )}
          </button>

          <div className="stock-status">
            {outOfStock ? (
              <span className="stock-dot out" />
            ) : (
              <span className="stock-dot in" />
            )}
            {stock === null
              ? 'Checking stock…'
              : outOfStock
                ? 'Out of stock'
                : `In stock — ${stock} available`}
          </div>

          <ul className="buy-notes">
            <li>
              <Truck size={17} />
              Ships in 2–3 business days
            </li>
            <li>
              <ShieldCheck size={17} />
              Secure checkout via Razorpay
            </li>
          </ul>
        </aside>

        <div className="product-details-col">
          <div className="prose reveal">
            <p>
              BOXDRIVE is a profoundly capable closed-loop stepper controller. Engineered with the{' '}
              <strong>ESP32-C6</strong> and <strong>TMC2209</strong> for silence, absolute precision, and wireless
              freedom.
            </p>
            <p>
              It&apos;s as easy to program as an Arduino, but it&apos;s a finished, robust device ready to drive
              robotics projects. Plug in your stepper motor, and let the on-board AS5600 magnetic rotary encoder keep
              track of absolute position at 0.0879° resolution.
            </p>
            <p>
              <strong>Key specs:</strong>
            </p>
            <ul>
              <li>Microcontroller: ESP32-C6 RISC-V (160 MHz)</li>
              <li>Motor driver: TMC2209 with StealthChop</li>
              <li>Max current: 2.0 A RMS</li>
              <li>Operating voltage: 4.75 V – 24.0 V</li>
              <li>Position encoder: AS5600 12-bit</li>
              <li>Connectivity: Wi-Fi 6, BLE 5, CAN (SN65HVD230)</li>
              <li>Dimensions: 42.31 × 42.31 × 9.1 mm</li>
            </ul>
          </div>

          <section className="faq reveal">
            <h2>Frequently asked questions</h2>
            <div className="faq-list">
              {faqs.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary>
                    {item.q}
                    <span aria-hidden>+</span>
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
