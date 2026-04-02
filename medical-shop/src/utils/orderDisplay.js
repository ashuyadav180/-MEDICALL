export const getOrderReference = (order) =>
  order?.reference || order?.orderNumber || order?.id || order?._id || 'BMS-0000';

export const buildCartItemFromOrderItem = (item, index = 0) => ({
  id: item?.medicine || item?.id || `order-item-${index}-${String(item?.name || 'medicine').toLowerCase().replace(/\s+/g, '-')}`,
  name: item?.name || 'Medicine',
  price: Number(item?.price || 0),
  quantity: Math.max(1, Number(item?.quantity || 1)),
  imageUrl: item?.imageUrl || '',
  category: item?.category || '',
  dosage: item?.dosage || '',
  packQuantity: item?.packQuantity || '',
  packUnit: item?.packUnit || '',
  manufacturer: item?.manufacturer || '',
});

export const reorderOrderItems = (order, addItem) => {
  if (!order?.orderItems?.length || typeof addItem !== 'function') {
    return 0;
  }

  return order.orderItems.reduce((totalQuantity, item, index) => {
    const cartItem = buildCartItemFromOrderItem(item, index);
    addItem(cartItem);
    return totalQuantity + cartItem.quantity;
  }, 0);
};

export const getShortOrderReference = (order) => {
  const reference = getOrderReference(order);
  if (!reference) {
    return 'BMS-0000';
  }

  return reference.length > 18 ? reference.slice(-10).toUpperCase() : reference.toUpperCase();
};

export const getStatusMeta = (status) => {
  const normalized = String(status || 'pending').toLowerCase();

  if (normalized === 'packing') {
    return {
      label: 'Packing at store',
      helper: 'The pharmacist is preparing your medicines and checking availability.',
    };
  }

  if (normalized === 'out') {
    return {
      label: 'Out for delivery',
      helper: 'Your package has left the store and is on the way.',
    };
  }

  if (normalized === 'delivered') {
    return {
      label: 'Delivered',
      helper: 'Your medicines were delivered successfully.',
    };
  }

  if (normalized === 'cancelled') {
    return {
      label: 'Cancelled',
      helper: 'This order was cancelled. Please contact the shop if this looks wrong.',
    };
  }

  return {
    label: 'Order placed',
    helper: 'Your order has been received and will be reviewed shortly.',
  };
};

export const getPaymentStatusMeta = (paymentStatus) => {
  const normalized = String(paymentStatus || 'pending').toLowerCase();

  if (normalized === 'received') {
    return {
      label: 'Payment received',
      helper: 'Your payment has been verified by the store.',
    };
  }

  return {
    label: 'Payment pending',
    helper: 'The store will verify your payment proof and update this status.',
  };
};
