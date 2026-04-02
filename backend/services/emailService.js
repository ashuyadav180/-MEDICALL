const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const isEmail = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());

const sendTransactionalEmail = async ({ to, toName, subject, textContent, htmlContent }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Bablu Medical Store';

  if (!apiKey || !senderEmail) {
    console.warn('Brevo email skipped: missing API key or sender email.');
    return { skipped: true, reason: 'missing_config' };
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName,
      },
      to: [
        {
          email: to,
          name: toName || to,
        },
      ],
      subject,
      textContent,
      htmlContent,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Brevo API error ${response.status}: ${responseText}`);
  }

  return responseText ? JSON.parse(responseText) : {};
};

const sendOtpEmail = async ({ email, name, otp }) => {
  if (!isEmail(email)) {
    throw new Error('A valid email is required to send OTP.');
  }

  return sendTransactionalEmail({
    to: email,
    toName: name,
    subject: 'Your Bablu Medical verification code',
    textContent: `Your Bablu Medical verification code is ${otp}. It expires in 5 minutes.`,
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #1c2d1f;">
          <h2>Bablu Medical verification code</h2>
          <p>Use the code below to continue your login or signup.</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0d7a42; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code expires in 5 minutes.</p>
        </body>
      </html>
    `,
  });
};

const sendOrderNotificationEmail = async ({ to, order, backendBaseUrl }) => {
  if (!isEmail(to)) {
    return { skipped: true, reason: 'invalid_email' };
  }

  const itemsMarkup = (order.orderItems || [])
    .map((item) => `<li>${item.name} x${item.quantity} - Rs.${Number(item.price * item.quantity).toFixed(2)}</li>`)
    .join('');

  return sendTransactionalEmail({
    to,
    toName: 'Store Owner',
    subject: `New order received: ${order.customerName}`,
    textContent: [
      'New order received',
      `Order ID: ${order.orderNumber || order._id}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Address: ${order.customerAddress}`,
      `Payment: ${String(order.paymentMethod || '').toUpperCase()}`,
      `Payment status: ${String(order.paymentStatus || 'pending').toUpperCase()}`,
      `${order.paymentReference ? `Payment ref: ${order.paymentReference}` : ''}`,
      `Total: Rs.${Number(order.totalPrice || 0).toFixed(2)}`,
      `Track: ${backendBaseUrl}/api/orders/track/${order.orderNumber || order._id}`,
      `${order.paymentScreenshot ? `Payment proof: ${order.paymentScreenshot}` : ''}`,
    ].join('\n'),
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #1c2d1f;">
          <h2>New order received</h2>
          <p><strong>Order ID:</strong> ${order.orderNumber || order._id}</p>
          <p><strong>Customer:</strong> ${order.customerName}</p>
          <p><strong>Phone:</strong> ${order.customerPhone}</p>
          <p><strong>Address:</strong> ${order.customerAddress}</p>
          <p><strong>Payment:</strong> ${String(order.paymentMethod || '').toUpperCase()}</p>
          <p><strong>Payment Status:</strong> ${String(order.paymentStatus || 'pending').toUpperCase()}</p>
          ${order.paymentReference ? `<p><strong>Payment Ref:</strong> ${order.paymentReference}</p>` : ''}
          <p><strong>Total:</strong> Rs.${Number(order.totalPrice || 0).toFixed(2)}</p>
          <h3>Items</h3>
          <ul>${itemsMarkup}</ul>
          ${order.paymentScreenshot ? `<p><a href="${order.paymentScreenshot}">Open payment proof</a></p>` : ''}
          <p><a href="${backendBaseUrl}/api/orders/track/${order.orderNumber || order._id}">Open tracking link</a></p>
        </body>
      </html>
    `,
  });
};

module.exports = {
  sendOtpEmail,
  sendOrderNotificationEmail,
};
