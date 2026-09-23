const mongoose = require('mongoose');
const { CATEGORIES, STATUSES } = require('../utils/constants');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    picture: {
      type: String, // relative URL, e.g. /uploads/products/<filename>
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORIES,
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be a positive number'],
    },
    discountPrice: {
      type: Number,
      default: null,
      min: [0, 'Discount price must be a positive number'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'Active',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Never return soft-deleted products in normal find() queries unless explicitly overridden
productSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined && this.getOptions().includeDeleted !== true) {
    this.where({ isDeleted: false });
  }
});

module.exports = mongoose.model('Product', productSchema);