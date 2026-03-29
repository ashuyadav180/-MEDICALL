const mongoose = require('mongoose');

const medicineSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a medicine name'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['tablet', 'syrup', 'capsule', 'cream', 'drops', 'injection', 'other'],
    },
    stock: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Medicine', medicineSchema);
