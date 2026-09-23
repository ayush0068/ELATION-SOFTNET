const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const { CATEGORIES, STATUSES } = require('../utils/constants');

const deleteFileIfExists = (relativePath) => {
  if (!relativePath) return;
  try {
    const absolutePath = path.join(__dirname, '..', '..', relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    console.error('Failed to delete old product image:', err.message);
  }
};

const validateProductFields = (body, { isUpdate = false } = {}) => {
  const errors = {};
  const { name, description, category, price, discountPrice, stockQuantity, status } = body;

  if (!isUpdate || name !== undefined) {
    if (!name || !name.trim()) errors.name = 'Product name is required';
  }

  if (!isUpdate || description !== undefined) {
    if (!description || !description.trim()) errors.description = 'Description is required';
  }

  if (!isUpdate || category !== undefined) {
    if (!category) errors.category = 'Category is required';
    else if (!CATEGORIES.includes(category)) errors.category = `Category must be one of: ${CATEGORIES.join(', ')}`;
  }

  if (!isUpdate || price !== undefined) {
    const priceNum = Number(price);
    if (price === undefined || price === null || price === '') errors.price = 'Price is required';
    else if (Number.isNaN(priceNum) || priceNum <= 0) errors.price = 'Price must be a positive number';
  }

  if (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') {
    const discountNum = Number(discountPrice);
    if (Number.isNaN(discountNum) || discountNum < 0) {
      errors.discountPrice = 'Discount price must be a positive number';
    } else if (price !== undefined && Number(price) > 0 && discountNum > Number(price)) {
      errors.discountPrice = 'Discount price cannot be greater than the price';
    }
  }

  if (!isUpdate || stockQuantity !== undefined) {
    const stockNum = Number(stockQuantity);
    if (stockQuantity === undefined || stockQuantity === null || stockQuantity === '') {
      errors.stockQuantity = 'Stock quantity is required';
    } else if (!Number.isInteger(stockNum) || stockNum < 0) {
      errors.stockQuantity = 'Stock quantity must be a non-negative whole number';
    }
  }

  if (status !== undefined && status !== '') {
    if (!STATUSES.includes(status)) errors.status = `Status must be one of: ${STATUSES.join(', ')}`;
  } else if (!isUpdate && !status) {
    // status optional on create; model defaults to 'Active'
  }

  return errors;
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  try {
    const errors = validateProductFields(req.body);
    if (Object.keys(errors).length > 0) {
      if (req.file) deleteFileIfExists(`/uploads/products/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { name, description, category, brand, price, discountPrice, stockQuantity, status } = req.body;

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      category,
      brand: brand ? brand.trim() : '',
      price: Number(price),
      discountPrice: discountPrice !== undefined && discountPrice !== '' ? Number(discountPrice) : null,
      stockQuantity: Number(stockQuantity),
      status: status || 'Active',
      picture: req.file ? `/uploads/products/${req.file.filename}` : null,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: 'Product created successfully', data: { product } });
  } catch (error) {
    if (req.file) deleteFileIfExists(`/uploads/products/${req.file.filename}`);
    console.error('Create product error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while creating product' });
  }
};

// @desc    Get products with search, category filter, status filter, pagination
// @route   GET /api/products?search=&category=&status=&page=&limit=
// @access  Private
exports.getProducts = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 12 } = req.query;

    const query = { isDeleted: false };

    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Get products error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while fetching products' });
  }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Private
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, data: { product } });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    console.error('Get product error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while fetching product' });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) {
      if (req.file) deleteFileIfExists(`/uploads/products/${req.file.filename}`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const errors = validateProductFields(req.body, { isUpdate: true });
    if (Object.keys(errors).length > 0) {
      if (req.file) deleteFileIfExists(`/uploads/products/${req.file.filename}`);
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { name, description, category, brand, price, discountPrice, stockQuantity, status } = req.body;

    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (category !== undefined) product.category = category;
    if (brand !== undefined) product.brand = brand.trim();
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined) {
      product.discountPrice = discountPrice === '' ? null : Number(discountPrice);
    }
    if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);
    if (status !== undefined) product.status = status;

    if (req.file) {
      deleteFileIfExists(product.picture);
      product.picture = `/uploads/products/${req.file.filename}`;
    }

    await product.save();

    return res.status(200).json({ success: true, message: 'Product updated successfully', data: { product } });
  } catch (error) {
    if (req.file) deleteFileIfExists(`/uploads/products/${req.file.filename}`);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    console.error('Update product error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while updating product' });
  }
};

// @desc    Change product status (Active/Inactive)
// @route   PATCH /api/products/:id/status
// @access  Private
exports.changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: { status: `Status must be one of: ${STATUSES.join(', ')}` },
      });
    }

    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.status = status;
    await product.save();

    return res.status(200).json({ success: true, message: 'Product status updated', data: { product } });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    console.error('Change status error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while updating status' });
  }
};

// @desc    Soft delete a product (sets isDeleted=true, deletedAt=now; never removed from DB)
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    console.error('Delete product error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while deleting product' });
  }
};