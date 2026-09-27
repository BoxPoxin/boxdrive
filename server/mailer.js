import nodemailer from 'nodemailer'

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM
} = process.env

// Create a reusable transporter object using SMTP transport
export const transporter = nodemailer.createTransport({
  host: SMTP_HOST || 'smtp.titan.email', // Default for Titan Email
  port: parseInt(SMTP_PORT || '465', 10), // Usually 465 (SSL)
  secure: parseInt(SMTP_PORT || '465', 10) === 465, // true for 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

/**
 * Sends an order confirmation email to the user.
 */
export async function sendOrderConfirmationEmail({ email, name, orderId, totalInr, paymentMethod, items = [], shipping = {} }) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('Skipping email. SMTP credentials not set.')
    return
  }

  const itemsHtml = items.map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 2px dashed #333; padding-bottom: 10px;">
      <span style="font-family: 'Arial Black', sans-serif; color: #FFFFFF;">${item.product_id} x${item.quantity}</span>
      <span style="color: #00ffcc; font-weight: bold;">₹${item.unit_price_inr * item.quantity}</span>
    </div>
  `).join('');

  const htmlContent = `
    <div style="font-family: 'Arial', sans-serif; background-color: #101018; color: #FFFFFF; padding: 40px 20px; text-align: center; border: 3px solid #08080C;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #181824; border: 3px solid #08080C; box-shadow: 6px 6px 0 #FF2FA8; padding: 40px 30px; text-align: left;">
        
        <div style="text-align: center; border-bottom: 3px solid #08080C; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-family: 'Arial Black', sans-serif; text-transform: uppercase; color: #00ffcc; margin-top: 0; font-size: 32px; text-shadow: 2px 2px 0 #08080C; margin-bottom: 10px;">
            ORDER CONFIRMED
          </h1>
          <p style="font-size: 16px; color: rgba(255, 255, 255, 0.7); margin: 0;">Thanks for your purchase, ${name.split(' ')[0]}!</p>
        </div>
        
        <div style="background-color: #101018; padding: 20px; border: 3px solid #08080C; box-shadow: 4px 4px 0 #2FF0E6; margin-bottom: 30px;">
          <h2 style="font-family: 'Arial Black', sans-serif; color: #2FF0E6; margin-top: 0; font-size: 20px; text-transform: uppercase;">Order Summary</h2>
          <div style="margin-bottom: 20px;">
            <p style="margin: 5px 0; color: #FFFFFF;"><strong>Order ID:</strong> <span style="font-family: monospace; color: #FFD23F;">${orderId}</span></p>
            <p style="margin: 5px 0; color: #FFFFFF;"><strong>Total:</strong> <span style="font-family: monospace; color: #FFD23F;">₹${totalInr}</span></p>
            <p style="margin: 5px 0; color: #FFFFFF;"><strong>Payment:</strong> <span style="font-family: monospace; color: #FFD23F;">${paymentMethod.toUpperCase()}</span></p>
          </div>
          
          <h3 style="font-family: 'Arial Black', sans-serif; color: #FF7A2F; font-size: 14px; text-transform: uppercase; margin-bottom: 10px;">Items</h3>
          ${itemsHtml || '<p style="color: #666;">No items found.</p>'}
        </div>

        <div style="background-color: #101018; padding: 20px; border: 3px solid #08080C; box-shadow: 4px 4px 0 #FFD23F; margin-bottom: 30px;">
          <h2 style="font-family: 'Arial Black', sans-serif; color: #FFD23F; margin-top: 0; font-size: 20px; text-transform: uppercase;">Shipping To</h2>
          <p style="margin: 5px 0; color: #FFFFFF;"><strong>${shipping.name || name}</strong></p>
          <p style="margin: 5px 0; color: rgba(255, 255, 255, 0.7); line-height: 1.5;">
            ${shipping.address || 'Address not provided'}<br>
            ${shipping.city || ''} - ${shipping.pincode || ''}
          </p>
        </div>

        <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7); text-align: center; margin-top: 40px; margin-bottom: 0;">
          We're preparing your order right now. You'll receive another email when it ships!
        </p>
        <p style="margin-top: 20px; font-size: 12px; color: rgba(255, 255, 255, 0.45); font-family: monospace; text-align: center;">
          BoxDrive - Designed for makers.
        </p>
      </div>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || `"BoxPox Support" <${SMTP_USER}>`, // sender address
      to: email, // list of receivers
      subject: `Order Confirmation - ${orderId}`, // Subject line
      html: htmlContent, // html body
    })

    console.log('Message sent: %s', info.messageId)
  } catch (error) {
    console.error('Error sending email:', error)
  }
}

/**
 * Sends a notification email to the admin when a new order is placed.
 */
export async function sendAdminOrderNotificationEmail(order) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('Skipping admin email. SMTP credentials not set.')
    return
  }
  
  const displayId = `BPX-${order.checkoutId.slice(0, 8).toUpperCase()}`
  
  const itemsHtml = order.items.map(item => `
    <li>
      <strong>${item.product_id}</strong> - Qty: ${item.quantity} (₹${item.unit_price_inr}/unit)
    </li>
  `).join('')

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333; padding: 20px;">
      <h2 style="color: #000; border-bottom: 2px solid #ccc; padding-bottom: 10px;">New Order Received! 🛒</h2>
      
      <p><strong>Order ID:</strong> ${displayId}</p>
      <p><strong>Total Amount:</strong> ₹${order.totalInr}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
      <p><strong>Razorpay Payment ID:</strong> ${order.razorpayPaymentId || 'N/A'}</p>
      
      <h3>Customer Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${order.shipping.name}</li>
        <li><strong>Email:</strong> ${order.shipping.email || 'N/A'}</li>
        <li><strong>Phone:</strong> ${order.shipping.phone}</li>
      </ul>
      
      <h3>Shipping Address:</h3>
      <p>
        ${order.shipping.address}<br>
        ${order.shipping.city} - ${order.shipping.pincode}
      </p>
      
      ${order.shipping.companyName ? `<p><strong>Company:</strong> ${order.shipping.companyName}</p>` : ''}
      ${order.shipping.gstNumber ? `<p><strong>GST Number:</strong> ${order.shipping.gstNumber}</p>` : ''}
      
      <h3>Items Ordered:</h3>
      <ul>
        ${itemsHtml}
      </ul>
      
      <p style="margin-top: 30px; font-size: 12px; color: #777;">
        This is an automated notification from BoxPox backend.
      </p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || `"BoxPox Notifications" <${SMTP_USER}>`,
      to: 'mukul@boxpox.in, contact@boxpox.in', // Send to admins
      subject: `New Order Alert! - ${displayId}`,
      html: htmlContent,
    })

    console.log('Admin notification email sent: %s', info.messageId)
  } catch (error) {
    console.error('Error sending admin email:', error)
  }
}

/**
 * Sends a notification email to the customer when their order status changes.
 */
export async function sendOrderStatusEmail({ email, name, orderId, status }) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('Skipping status email. SMTP credentials not set.')
    return
  }

  const displayId = orderId.startsWith('BPX-') ? orderId : `BPX-${orderId.slice(0, 8).toUpperCase()}`
  
  let statusColor, statusTitle, statusMessage;
  
  switch (status.toLowerCase()) {
    case 'shipped':
      statusColor = '#2FF0E6'; // Cyan
      statusTitle = 'Your Order Has Shipped! 🚀';
      statusMessage = 'Great news! Your BoxDrive order is on its way. Keep an eye out for the delivery.';
      break;
    case 'completed':
      statusColor = '#4ADE80'; // Green
      statusTitle = 'Order Delivered! 🎉';
      statusMessage = 'Your order has been marked as completed/delivered. Enjoy your BoxDrive gear!';
      break;
    case 'cancelled':
      statusColor = '#FF2FA8'; // Magenta
      statusTitle = 'Order Cancelled ❌';
      statusMessage = 'Your order has been cancelled. If you believe this is a mistake or if you need a refund, please reply to this email.';
      break;
    case 'processing':
      statusColor = '#FFD23F'; // Yellow
      statusTitle = 'Order is Processing ⚙️';
      statusMessage = 'We are currently preparing your order for shipment. We will let you know once it leaves our facility.';
      break;
    default:
      statusColor = '#00ffcc';
      statusTitle = `Order Status Update: ${status.toUpperCase()}`;
      statusMessage = `There is an update regarding your order. Current status: ${status}.`;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #101018; color: #ffffff; padding: 30px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #181824; border: 3px solid #08080C; box-shadow: 6px 6px 0 ${statusColor}; padding: 30px;">
        <h1 style="color: ${statusColor}; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">${statusTitle}</h1>
        <p style="font-size: 16px;">Hi ${name},</p>
        <p style="font-size: 16px;">${statusMessage}</p>
        
        <div style="background-color: #101018; padding: 15px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
          <p style="margin: 0;"><strong>Order ID:</strong> ${displayId}</p>
        </div>

        <p style="font-size: 14px; color: #a3a3a3; margin-top: 30px;">Reply to this email if you have any questions.</p>
        <hr style="border-color: #333; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666; font-family: monospace;">BoxDrive - Designed for makers.</p>
      </div>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || `"BoxPox Support" <${SMTP_USER}>`,
      to: email,
      subject: `Order Update (${status.toUpperCase()}) - ${displayId}`,
      html: htmlContent,
    })

    console.log('Status email sent to %s: %s', email, info.messageId)
  } catch (error) {
    console.error('Error sending status email:', error)
  }
}
