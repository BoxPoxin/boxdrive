import { AuthProvider } from './lib/auth'
import { CartProvider } from './lib/cart'
import { NavProvider, useNav } from './lib/nav'
import { Layout } from './components/Layout'
import { lazy, Suspense, useEffect } from 'react'

const Home = lazy(() => import('./pages/Home').then(({ Home }) => ({ default: Home })))
const Product = lazy(() => import('./pages/Product').then(({ Product }) => ({ default: Product })))
const Cart = lazy(() => import('./pages/Cart').then(({ Cart }) => ({ default: Cart })))
const Checkout = lazy(() => import('./pages/Checkout').then(({ Checkout }) => ({ default: Checkout })))
const Login = lazy(() => import('./pages/Login').then(({ Login }) => ({ default: Login })))
const SignUp = lazy(() => import('./pages/SignUp').then(({ SignUp }) => ({ default: SignUp })))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(({ ForgotPassword }) => ({ default: ForgotPassword })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(({ ResetPassword }) => ({ default: ResetPassword })))
const Account = lazy(() => import('./pages/Account').then(({ Account }) => ({ default: Account })))
const Orders = lazy(() => import('./pages/Orders').then(({ Orders }) => ({ default: Orders })))
const Terms = lazy(() => import('./pages/Terms').then(({ Terms }) => ({ default: Terms })))

function Routes() {
  const { path } = useNav()
  
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  if (path === '/product') return <Product />
  if (path === '/cart') return <Cart />
  if (path === '/checkout' || path === '/order') return <Checkout />
  if (path === '/login') return <Login />
  if (path === '/signup') return <SignUp />
  if (path === '/forgot-password') return <ForgotPassword />
  if (path === '/reset-password') return <ResetPassword />
  if (path === '/account') return <Account />
  if (path === '/orders') return <Orders />
  if (path === '/terms') return <Terms />
  return <Home />
}

export default function App() {
  return (
    <NavProvider>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <Suspense fallback={<div className="route-loading"><span className="loader-dot" />Loading BOXPOX…</div>}>
              <Routes />
            </Suspense>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </NavProvider>
  )
}
