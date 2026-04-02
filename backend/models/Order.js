const mongoose = require('mongoose');

const generateOrderNumber = () => {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BMS-${datePart}-${randomPart}`;
};

const orderSchema = mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for guest orders
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerAddress: {
      type: String,
      required: true,
    },
    customerAddressDetails: {
      addressLine1: { type: String, default: '' },
      area: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      landmark: { type: String, default: '' },
      nearby: { type: String, default: '' },
    },
    orderItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        imageUrl: { type: String, default: '' },
        manufacturer: { type: String, default: '' },
        dosage: { type: String, default: '' },
        packQuantity: { type: Number, default: null },
        packUnit: { type: String, default: '' },
        category: { type: String, default: 'other' },
        medicine: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Medicine',
          required: true,
        },
      },
    ],
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cod', 'upi'],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'received'],
      default: 'pending',
    },
    paymentScreenshot: {
      type: String,
      default: '',
    },
    paymentReference: {
      type: String,
      default: '',
      trim: true,
    },
    paymentProofSubmittedAt: {
      type: Date,
    },
    prescriptionImage: {
      type: String, // Cloudinary URL
      required: false,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'packing', 'out', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    paidAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre('validate', async function attachOrderNumber() {
  if (this.orderNumber) {
    return;
  }

  let candidate = generateOrderNumber();
  let exists = await this.constructor.exists({
    orderNumber: candidate,
    _id: { $ne: this._id },
  });

  while (exists) {
    candidate = generateOrderNumber();
    exists = await this.constructor.exists({
      orderNumber: candidate,
      _id: { $ne: this._id },
    });
  }

  this.orderNumber = candidate;
});

module.exports = mongoose.model('Order', orderSchema);
