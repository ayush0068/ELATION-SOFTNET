const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const uploadProductImage = require('../middleware/uploadMiddleware');
const { CATEGORIES, STATUSES } = require('../utils/constants');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  changeStatus,
  deleteProduct,
} = require('../controllers/productController');

// All product routes require a valid JWT
router.use(protect);

// Static dropdown options for the Add/Edit Product forms
router.get('/meta/options', (req, res) => {
  res.status(200).json({ success: true, data: { categories: CATEGORIES, statuses: STATUSES } });
});

router.route('/')
  .get(getProducts)
  .post(uploadProductImage, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(uploadProductImage, updateProduct)
  .delete(deleteProduct);

router.patch('/:id/status', changeStatus);

module.exports = router;