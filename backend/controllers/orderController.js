const Order = require('../models/Order');

const getBackendBaseUrl = (req) =>
  process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;

// @desc    Create new order
// @route   POST /api/orders
const addOrderItems = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      orderItems,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    const parsedOrderItems =
      typeof orderItems === 'string' ? JSON.parse(orderItems) : orderItems;
    const prescriptionImage = req.file
      ? req.file.path?.startsWith('http')
        ? req.file.path
        : `${getBackendBaseUrl(req)}/uploads/prescriptions/${req.file.filename}`
      : null;

    if (parsedOrderItems && parsedOrderItems.length === 0 && !prescriptionImage) {
      return res.status(400).json({ message: 'No order items' });
    }

    if (Number(itemsPrice) < 100) {
      return res.status(400).json({
        message: 'Minimum order amount is ₹100 (excluding delivery charges).',
      });
    }

    const order = new Order({
      user: req.user ? req.user._id : null,
      customerName,
      customerPhone,
      customerAddress,
      orderItems: parsedOrderItems,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      prescriptionImage,
    });

    const createdOrder = await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_order', {
        id: createdOrder._id,
        customerName: createdOrder.customerName,
        totalPrice: createdOrder.totalPrice,
        createdAt: createdOrder.createdAt,
        status: createdOrder.status,
      });
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: 'Invalid order data' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
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

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Invalid status update' });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
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

    res.json(updatedOrder);
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
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderStatus,
  getOrders,
  getAnalytics,
  assignOrder,
  getPartnerOrders,
};
