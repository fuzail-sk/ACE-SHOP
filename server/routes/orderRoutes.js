import { Router } from 'express';

import {
  allOrders,
  createOrder,
  myOrders,
  updateOrderStatus,
  verifyPayment
} from '../controllers/orderController.js';

import { adminOnly, protect } from '../middleware/auth.js';

const router = Router();


// ==========================================
// STUDENT
// Guest checkout - NO LOGIN REQUIRED
// ==========================================
router.post('/', createOrder);


// ==========================================
// LOGGED-IN USER
// ==========================================
router.get('/mine', protect, myOrders);


// ==========================================
// ADMIN / SENIOR
// ==========================================
router.get('/', protect, adminOnly, allOrders);


// Update shipping/order status
router.patch(
  '/:id/status',
  protect,
  adminOnly,
  updateOrderStatus
);


// Approve / reject payment
router.patch(
  '/:id/payment',
  protect,
  adminOnly,
  verifyPayment
);


export default router;