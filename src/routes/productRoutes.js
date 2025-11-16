const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Rota pública
router.get('/produtos', productController.getAllProducts);

// Rota privada
// Apenas 'VENDEDOR' pode criar produto
router.post(
  '/produtos',
  protect,
  authorize('VENDEDOR'),
  productController.createProduct
);

// Apenas 'VENDEDOR' ou 'ADMIN' podem mudar o preço
router.put(
  '/preco/:id',
  protect,
  authorize('VENDEDOR', 'ADMIN'),
  productController.updateProductPrice
);

module.exports = router;