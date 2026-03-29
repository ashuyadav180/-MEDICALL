const DEFAULT_NOTIFY_TO = '919371493956';

const formatCurrency = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

const sanitizePhoneNumber = (value) => String(value || '').replace(/\D/g, '');

const buildOrderItemsText = (orderItems = []) =>
  orderItems.map((item) => `- ${item.name} x${item.quantity} (${formatCurrency(item.price * item.quantity)})`).join('\n');

const buildOrderMessage = ({ order, backendBaseUrl }) => {
  const lines = [
    'New medicine order received',
    '',
    `Order ID: ${order._id}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `Address: ${order.customerAddress}`,
    `Payment: ${String(order.paymentMethod || '').toUpperCase()}`,
    `Items total: ${formatCurrency(order.itemsPrice)}`,
    `Delivery: ${formatCurrency(order.shippingPrice)}`,
    `Grand total: ${formatCurrency(order.totalPrice)}`,
    '',
    'Items:',
    buildOrderItemsText(order.orderItems),
  ];

  if (order.prescriptionImage) {
    lines.push('', `Prescription: ${order.prescriptionImage}`);
  }

  if (backendBaseUrl) {
    lines.push('', `Track order: ${backendBaseUrl}/api/orders/${order._id}`);
  }

  return lines.join('\n');
};

const sendNewOrderWhatsApp = async ({ order, backendBaseUrl }) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';
  const notifyTo = sanitizePhoneNumber(process.env.WHATSAPP_NOTIFY_TO || DEFAULT_NOTIFY_TO);

  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp notification skipped: missing Cloud API configuration.');
    return { skipped: true, reason: 'missing_config' };
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: notifyTo,
      type: 'text',
      text: {
        preview_url: false,
        body: buildOrderMessage({ order, backendBaseUrl }),
      },
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`WhatsApp API error ${response.status}: ${responseText}`);
  }

  return JSON.parse(responseText);
};

module.exports = {
  sendNewOrderWhatsApp,
};
