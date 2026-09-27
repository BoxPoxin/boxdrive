import { Link } from '../lib/nav'

export function Terms() {
  return (
    <div className="narrow-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>/</span>
        <strong>Terms & Conditions</strong>
      </nav>

      <div className="prose" style={{ marginTop: '2rem' }}>
        <h1>Terms & Conditions</h1>
        <p className="muted">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing or using our website and purchasing products from BOXPOX, you agree to be bound by these Terms and Conditions.
          If you do not agree with any part of these terms, you may not use our services.
        </p>

        <h2>2. Products and Pricing</h2>
        <p>
          All products, including BOXDRIVE, are subject to availability. We reserve the right to discontinue any product at any time.
          Prices for our products are subject to change without notice. All prices include GST where applicable.
        </p>

        <h2>3. Orders and Payments</h2>
        <p>
          We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order.
          Payments are securely processed via Razorpay. We do not store your credit card information.
        </p>

        <h2>4. Shipping and Delivery</h2>
        <p>
          We aim to dispatch orders within 2-3 business days. Delivery times may vary depending on your location and carrier delays out of our control.
        </p>

        <h2>5. Returns and Refunds</h2>
        <p>
          Due to the nature of electronic components, we offer returns only on defective hardware within 14 days of receipt.
          If you believe your product is defective, please contact our support team with your order details and photos of the issue.
        </p>

        <h2>6. Warranty</h2>
        <p>
          BOXDRIVE is provided "as is" without any warranty of any kind, either express or implied, including but not limited to the implied warranties of merchantability and fitness for a particular purpose.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          BOXPOX shall not be liable for any direct, indirect, incidental, consequential, or exemplary damages resulting from your use or inability to use the products.
        </p>

        <h2>8. Contact Information</h2>
        <p>
          Questions about the Terms and Conditions should be sent to us at our registered address or via the contact details provided in the footer of this website.
        </p>
      </div>
    </div>
  )
}
