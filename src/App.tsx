import { AuthProvider } from './lib/auth'
import { CartProvider } from './lib/cart'
import { NavProvider, useNav } from './lib/nav'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Product } from './pages/Product'
import { Cart } from './pages/Cart'
import { Checkout } from './pages/Checkout'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Account } from './pages/Account'
import { Terms } from './pages/Terms'

function Routes() {
  const { path } = useNav()
  if (path === '/product') return <Product />
  if (path === '/cart') return <Cart />
  if (path === '/checkout' || path === '/order') return <Checkout />
  if (path === '/login') return <Login />
  if (path === '/signup') return <SignUp />
  if (path === '/forgot-password') return <ForgotPassword />
  if (path === '/reset-password') return <ResetPassword />
  if (path === '/account') return <Account />
  if (path === '/terms') return <Terms />
  return <Home />
}

export default function App() {
  return (
    <NavProvider>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <Routes />
          </Layout>
        </CartProvider>
      </AuthProvider>
    </NavProvider>
  )
}
