const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Rota para criar um novo pedido.
// Deve estar logado (protect) e ser um 'COMPRADOR' ou 'ADMIN'
router.post(
  '/',
  protect,
  authorize('COMPRADOR', 'ADMIN'),
  orderController.createOrder
);

// Rota para VER MEUS pedidos
router.get(
  '/', 
  protect,
  authorize('COMPRADOR'),
  orderController.getMyOrders
);

module.exports = router;