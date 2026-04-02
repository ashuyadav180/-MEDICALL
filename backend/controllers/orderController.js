const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const { sendNewOrderWhatsApp } = require('../services/whatsappService');
const { sendOrderNotificationEmail } = require('../services/emailService');
const mongoose = require('mongoose');

const getBackendBaseUrl = (req) =>
  process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;

const getUploadedFileUrl = (req, fieldName) => {
  const file = req.files?.[fieldName]?.[0];
  if (!file) {
    return null;
  }

  if (file.path?.startsWith('http')) {
    return file.path;
  }

  return `${getBackendBaseUrl(req)}/uploads/prescriptions/${file.filename}`;
};

const parseAddressDetails = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const generateOrderNumber = () => {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BMS-${datePart}-${randomPart}`;
};

const createUniqueOrderNumber = async () => {
  let orderNumber = generateOrderNumber();
  let exists = await Order.exists({ orderNumber });

  while (exists) {
    orderNumber = generateOrderNumber();
    exists = await Order.exists({ orderNumber });
  }

  return orderNumber;
};

const buildOrderItemSnapshot = (item, medicine) => ({
  name: medicine.name,
  quantity: Number(item.quantity),
  price: Number(medicine.price),
  medicine: medicine._id,
  imageUrl: medicine.imageUrl || '',
  manufacturer: medicine.manufacturer || '',
  dosage: medicine.dosage || '',
  packQuantity: medicine.packQuantity ?? null,
  packUnit: medicine.packUnit || '',
  category: medicine.category || 'other',
});

const serializeOrder = (orderDoc) => {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  return {
    ...order,
    id: String(order._id),
    reference: order.orderNumber || String(order._id),
  };
};

const serializeTrackOrder = (orderDoc) => {
  const order = serializeOrder(orderDoc);
  return {
    id: order.id,
    reference: order.reference,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    customerAddressDetails: order.customerAddressDetails,
    orderItems: order.orderItems,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentReference: order.paymentReference,
    itemsPrice: order.itemsPrice,
    shippingPrice: order.shippingPrice,
    totalPrice: order.totalPrice,
    status: order.status,
    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt,
    prescriptionImage: order.prescriptionImage,
  };
};

const findOrderByReference = async (reference) => {
  const normalizedReference = String(reference || '').trim();

  if (!normalizedReference) {
    return null;
  }

  const order = await Order.findOne({ orderNumber: normalizedReference }).populate('user', 'name email');
  if (order) {
    return order;
  }

  if (mongoose.Types.ObjectId.isValid(normalizedReference)) {
    return Order.findById(normalizedReference).populate('user', 'name email');
  }

  return null;
};

// @desc    Create new order
// @route   POST /api/orders
const addOrderItems = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      customerAddressDetails,
      orderItems,
      paymentMethod,
      paymentReference,
      itemsPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    const parsedOrderItems =
      typeof orderItems === 'string' ? JSON.parse(orderItems) : orderItems;
    const parsedAddressDetails = parseAddressDetails(customerAddressDetails);
    const prescriptionImage = getUploadedFileUrl(req, 'prescription');
    const paymentScreenshot = getUploadedFileUrl(req, 'paymentScreenshot');

    if (parsedOrderItems && parsedOrderItems.length === 0 && !prescriptionImage) {
      return res.status(400).json({ message: 'No order items' });
    }

    if (paymentMethod === 'upi' && !paymentScreenshot) {
      return res.status(400).json({ message: 'Please upload your UPI payment screenshot.' });
    }

    if (Number(itemsPrice) < 100) {
      return res.status(400).json({
        message: 'Minimum order amount is ₹100 (excluding delivery charges).',
      });
    }

    const medicines = await Medicine.find({
      _id: { $in: parsedOrderItems.map((item) => item.medicine) },
    });
    const medicineMap = new Map(medicines.map((medicine) => [String(medicine._id), medicine]));

    for (const item of parsedOrderItems) {
      const medicine = medicineMap.get(String(item.medicine));

      if (!medicine) {
        return res.status(400).json({ message: `Medicine not found for item ${item.name}` });
      }

      if (medicine.stock < item.quantity) {
        return res.status(400).json({
          message: `${medicine.name} only has ${medicine.stock} item(s) left in stock.`,
        });
      }
    }

    const enrichedOrderItems = parsedOrderItems.map((item) => {
      const medicine = medicineMap.get(String(item.medicine));
      return buildOrderItemSnapshot(item, medicine);
    });

    const order = new Order({
      orderNumber: await createUniqueOrderNumber(),
      user: req.user ? req.user._id : null,
      customerName,
      customerPhone,
      customerAddress,
      customerAddressDetails: parsedAddressDetails,
      orderItems: enrichedOrderItems,
      paymentMethod,
      paymentStatus: 'pending',
      paymentScreenshot,
      paymentReference,
      paymentProofSubmittedAt: paymentScreenshot ? new Date() : null,
      itemsPrice,
      shippingPrice,
      totalPrice,
      prescriptionImage,
    });

    for (const item of parsedOrderItems) {
      const medicine = medicineMap.get(String(item.medicine));
      medicine.stock -= item.quantity;
      await medicine.save();
    }

    const createdOrder = await order.save();
    const backendBaseUrl = getBackendBaseUrl(req);

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_order', {
        id: createdOrder._id,
        orderNumber: createdOrder.orderNumber,
        customerName: createdOrder.customerName,
        totalPrice: createdOrder.totalPrice,
        createdAt: createdOrder.createdAt,
        status: createdOrder.status,
      });
    }

    const notificationTasks = [
      sendNewOrderWhatsApp({
        order: createdOrder,
        backendBaseUrl,
      }),
      sendOrderNotificationEmail({
        to: process.env.ORDER_NOTIFICATION_EMAIL,
        order: createdOrder,
        backendBaseUrl,
      }),
    ];

    const [whatsAppResult, emailResult] = await Promise.allSettled(notificationTasks);

    if (whatsAppResult.status === 'rejected') {
      console.error(`WhatsApp notification failed for order ${createdOrder._id}: ${whatsAppResult.reason.message}`);
    }

    if (emailResult.status === 'rejected') {
      console.error(`Email notification failed for order ${createdOrder._id}: ${emailResult.reason.message}`);
    }

    res.status(201).json(serializeOrder(createdOrder));
  } catch (error) {
    console.error('Order creation failed:', error);

    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors || {})
        .map((entry) => entry.message)
        .filter(Boolean)
        .join(', ');

      return res.status(400).json({ message: details || 'Invalid order data' });
    }

    if (error?.code === 11000) {
      return res.status(400).json({ message: 'Duplicate order reference generated. Please try again.' });
    }

    return res.status(400).json({ message: error?.message || 'Invalid order data' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await findOrderByReference(req.params.id);

    if (order) {
      const isAdmin = req.user?.role === 'admin';
      const isOwner = req.user && order.user && String(order.user._id) === String(req.user._id);

      if (req.user && !isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }

      res.json(serializeOrder(order));
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get public tracking details by order reference
// @route   GET /api/orders/track/:reference
const getTrackOrder = async (req, res) => {
  try {
    const order = await findOrderByReference(req.params.reference);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(serializeTrackOrder(order));
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update order to packing/out/delivered
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      req.user?.role === 'delivery_person' &&
      String(order.deliveryPartner) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: 'This delivery task is not assigned to you' });
    }

    order.status = req.body.status || order.status;

    if (order.status === 'delivered') {
      order.deliveredAt = Date.now();
      if (order.paymentMethod === 'cod' && order.paymentStatus !== 'received') {
        order.paymentStatus = 'received';
        order.paidAt = Date.now();
      }
    }

    const updatedOrder = await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order._id}`).emit('status_updated', {
        id: order._id,
        status: order.status,
      });
      io.to('admin_room').emit('order_status_changed', {
        id: order._id,
        status: order.status,
      });
    }

    res.json(serializeOrder(updatedOrder));
  } catch (error) {
    res.status(400).json({ message: 'Invalid status update' });
  }
};

// @desc    Update order payment status
// @route   PUT /api/orders/:id/payment-status
const updateOrderPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const nextPaymentStatus = String(req.body.paymentStatus || '').trim().toLowerCase();
    if (!['pending', 'received'].includes(nextPaymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    order.paymentStatus = nextPaymentStatus;
    order.paidAt = nextPaymentStatus === 'received' ? Date.now() : undefined;

    const updatedOrder = await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order._id}`).emit('payment_status_updated', {
        id: order._id,
        paymentStatus: updatedOrder.paymentStatus,
      });
      io.to('admin_room').emit('order_payment_changed', {
        id: order._id,
        paymentStatus: updatedOrder.paymentStatus,
      });
    }

    return res.json(serializeOrder(updatedOrder));
  } catch (error) {
    return res.status(400).json({ message: 'Invalid payment status update' });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get Analytics Data
// @route   GET /api/orders/analytics/stats
const getAnalytics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const topMedicines = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.name',
          qty: { $sum: '$orderItems.quantity' },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]);

    res.json({ stats, topMedicines });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Assign order to delivery partner
// @route   PUT /api/orders/:id/assign
const assignOrder = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.deliveryPartner = deliveryPartnerId;
    order.status = 'out';
    const updatedOrder = await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${deliveryPartnerId}`).emit('new_task_assigned', {
        id: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customerName,
        customerPhone: updatedOrder.customerPhone,
        customerAddress: updatedOrder.customerAddress,
        paymentMethod: updatedOrder.paymentMethod,
        totalPrice: updatedOrder.totalPrice,
        status: updatedOrder.status,
      });
      io.to('admin_room').emit('order_status_changed', {
        id: updatedOrder._id,
        status: updatedOrder.status,
      });
    }

    res.json(serializeOrder(updatedOrder));
  } catch (error) {
    res.status(400).json({ message: 'Error assigning partner' });
  }
};

// @desc    Get orders assigned to a delivery partner
// @route   GET /api/orders/my/tasks
const getPartnerOrders = async (req, res) => {
  try {
    const query =
      req.user.role === 'admin'
        ? {}
        : { deliveryPartner: req.user._id };

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  getTrackOrder,
  updateOrderStatus,
  updateOrderPaymentStatus,
  getOrders,
  getMyOrders,
  getAnalytics,
  assignOrder,
  getPartnerOrders,
};
