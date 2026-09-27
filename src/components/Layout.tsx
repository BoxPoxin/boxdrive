import { ShoppingBag } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNav } from '../lib/nav'
import { useCart } from '../lib/cart'
import { useAuth } from '../lib/auth'

export function Layout({ children }: { children: ReactNode }) {
  const { path, navigate } = useNav()
  const { count } = useCart()
  const { session, logOut } = useAuth()
  const onHome = path === '/'

  /* ── hide topbar on scroll-down, show on scroll-up ── */
  const lastY = useRef(0)
  const [hidden, setHidden] = useState(false)

  const onScroll = useCallback(() => {
    const y = window.scrollY
    if (y > 80 && y > lastY.current + 8) setHidden(true)
    if (y < lastY.current - 4) setHidden(false)
    lastY.current = y
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  /* ── reveal on mount ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [path]) // re-run on page change

  return (
    <div className="site">
      <div className="marquee">
        <div className="marquee-content">
          <span>⚡ SHIPS IN 2-3 BUSINESS DAYS</span>
          <span className="star">★</span>
          <span>CLOSED-LOOP NEMA 17</span>
          <span className="star">★</span>
          <span>⚡ SHIPS IN 2-3 BUSINESS DAYS</span>
          <span className="star">★</span>
          <span>CLOSED-LOOP NEMA 17</span>
          <span className="star">★</span>
          <span>⚡ SHIPS IN 2-3 BUSINESS DAYS</span>
          <span className="star">★</span>
          <span>CLOSED-LOOP NEMA 17</span>
        </div>
      </div>
      <header
        className="topbar"
        style={{ transform: hidden ? 'translateY(-110%)' : 'translateY(0)' }}
      >
        <Link to="/" className="brand" aria-label="BOXPOX — home">
          <img src="/boxpox_logo.png" alt="" className="brand-mark" />
          <span className="brand-word">BOXPOX</span>
        </Link>
        <div className="topbar-actions">
          <Link to="/product" className="btn btn-buy">
            Buy
          </Link>
          {session ? (
            <>
              <Link to="/account" className="account-link">
                Account
              </Link>
              <button
                type="button"
                className="account-link"
                onClick={() => {
                  void logOut()
                  navigate('/')
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="account-link">
              Log in
            </Link>
          )}
          <Link to="/cart" className="cart-btn" aria-label={`View cart, ${count} items`}>
            <ShoppingBag size={18} strokeWidth={2.4} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
        </div>
      </header>

      <main>{children}</main>

      {onHome && (
        <div className="sticky-cta">
          <div className="sticky-cta-inner">
            <span>In stock · ships in 2–3 business days</span>
            <Link to="/product" className="btn btn-buy btn-buy-sm">
              Buy
            </Link>
          </div>
        </div>
      )}

      <footer className="site-footer">
        <Link to="/" className="brand brand-footer" aria-label="BOXPOX — home">
          <img src="/boxpox_logo.png" alt="" className="brand-mark" />
          <span className="brand-word">BOXPOX</span>
        </Link>
        <div className="footer-links">
          <a href="/datasheet.html" target="_blank" rel="noreferrer">
            Datasheet
          </a>
          <Link to="/product">Shop</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/terms">Terms & Conditions</Link>
        </div>
        
        <div className="footer-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <p>
            <strong>Address:</strong> D-180C, Phase 8B, Industrial Area, Sector 74, Sahibzada Ajit Singh Nagar, Punjab 160055
          </p>
          <p>
            <strong>Phone:</strong> 9041579564, 7888601710
          </p>
          <p style={{ marginTop: '0.5rem', opacity: 0.6 }}>
            © {new Date().getFullYear()} BOXPOX · Designed in India · BOXDRIVE · HW v3.26
          </p>
        </div>
      </footer>
    </div>
  )
}
