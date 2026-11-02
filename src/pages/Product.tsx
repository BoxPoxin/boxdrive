import { useEffect, useState } from 'react'
import { BookOpen, Cable, Check, CircuitBoard, Layers2, Magnet, Minus, PackageCheck, Plus, ShieldCheck, Truck, Wrench } from 'lucide-react'
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
      maxQty,
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
          <span className="eyebrow">Closed-loop motion controller</span>
          <h1>{PRODUCT.name}</h1>
          <p className="product-tagline">{PRODUCT.tagline}</p>
          <div className="price-row">
            <div><div className="price">{formatInr(selected.price)}</div><span className="tax-note">Inclusive of GST</span></div>
            <span className="edition-label">Standard edition</span>
          </div>

          <div className="product-buy-actions">
            <div className="qty-control" aria-label="Quantity">
              <span>Quantity</span>
              <div className="qty">
                <button aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((n) => Math.max(1, n - 1))}><Minus size={15} /></button>
                <span>{qty}</span>
                <button aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty((n) => Math.min(maxQty, n + 1))}><Plus size={15} /></button>
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
          </div>

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
            <span className="eyebrow">Built for your next build</span>
            <h2>More control. Less guesswork.</h2>
            <p>BOXDRIVE combines an ESP32-C6, quiet TMC2209 driver and a magnetic encoder in one compact NEMA 17 controller. Get reliable position feedback with Wi-Fi, BLE and CAN ready to use.</p>
            <div className="product-spec-strip"><span><b>2.0 A</b> RMS output</span><span><b>4.75–24 V</b> input</span><span><b>12-bit</b> encoder</span><span><b>42 mm</b> footprint</span></div>
          </div>

        </div>

        <section className="product-specifications reveal" id="product-specifications">
          <details className="specifications-accordion">
            <summary>
              <span><span className="eyebrow">Product specifications</span><strong>Engineered for precise, connected motion.</strong></span>
              <Plus size={18} aria-hidden="true" />
            </summary>
            <div className="specifications-content">
              <p className="specifications-intro">Key hardware, operating limits, and development options for integrating BOXDRIVE into your build.</p>
            <div className="spec-table-wrap">
              <table className="spec-table">
                <tbody>
                  <tr><th scope="row">Controller</th><td>ESP32-C6 RISC-V, 160 MHz; 4 MB flash</td></tr>
                  <tr><th scope="row">Motor driver</th><td>TMC2209 with StealthChop and SpreadCycle modes</td></tr>
                  <tr><th scope="row">Output current</th><td>Up to 2.0 A RMS</td></tr>
                  <tr><th scope="row">Supply voltage</th><td>4.75–24 V DC, XT30 input</td></tr>
                  <tr><th scope="row">Position feedback</th><td>AS5600 magnetic encoder, 12-bit resolution</td></tr>
                  <tr><th scope="row">Connectivity</th><td>Wi-Fi 6, Bluetooth LE 5, CAN bus</td></tr>
                  <tr><th scope="row">Programming</th><td>USB-C; Arduino IDE, PlatformIO, or ESP-IDF</td></tr>
                  <tr><th scope="row">Board dimensions</th><td>42.31 × 42.31 × 9.1 mm; 31 mm NEMA 17 mounting pattern</td></tr>
                </tbody>
              </table>
            </div>
            <div className="specification-notes">
              <article><h3>Position feedback</h3><p>The encoder reads the motor shaft position so the controller can correct movement as it happens.</p></article>
              <article><h3>Motion modes</h3><p>Use quiet StealthChop for smooth movement or switch to SpreadCycle when your application needs more dynamic response.</p></article>
              <article><h3>System integration</h3><p>USB-C supports development and setup. Built-in wireless and CAN simplify control across connected axes.</p></article>
            </div>
            </div>
          </details>
        </section>

        <section className="product-included reveal">
          <details className="included-accordion">
            <summary>
              <span><span className="eyebrow">In the box</span><strong>Everything you need to get started.</strong></span>
              <Plus size={18} aria-hidden="true" />
            </summary>
            <div className="included-copy">
              <p>BOXDRIVE arrives with the essential mounting and connection parts for your setup.</p>
              <ul className="included-items">
                <li><CircuitBoard size={19} /><span>BOXDRIVE controller</span></li>
                <li><Cable size={19} /><span>XT30 CAN cable</span></li>
                <li><Layers2 size={19} /><span>Aluminum heatsink</span></li>
                <li><PackageCheck size={19} /><span>Protective casing</span></li>
                <li><Wrench size={19} /><span>4 M3 mounting screws</span></li>
                <li><Magnet size={19} /><span>Encoder magnet</span></li>
                <li><BookOpen size={19} /><span>Quick-start manual</span></li>
              </ul>
            </div>
          </details>
        </section>

        <section className="faq reveal">
          <div className="faq-heading"><span className="eyebrow">Need a hand?</span><h2>Frequently asked questions</h2></div>
          <div className="faq-list">
            {faqs.map((item) => (
              <details key={item.q} className="faq-item">
                <summary>{item.q}<Plus size={17} aria-hidden="true" /></summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
