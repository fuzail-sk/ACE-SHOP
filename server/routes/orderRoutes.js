import express from 'express';

import {
  createOrder,
  myOrders,
  allOrders,
  updateOrderStatus,
  verifyPayment,
  exportOrders,
  getPaymentScreenshot,
} from '../controllers/orderController.js';

import protect from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';
import uploadPaymentScreenshot from '../middleware/uploadPaymentScreenshot.js';

const router = express.Router();


// ==========================================
// ADMIN EXPORT
// ==========================================

router.get(
  '/export',
  protect,
  adminOnly,
  exportOrders
);


// ==========================================
// ADMIN - ALL ORDERS
// ==========================================

router.get(
  '/',
  protect,
  adminOnly,
  allOrders
);


// ==========================================
// USER - MY ORDERS
// ==========================================

router.get(
  '/mine',
  protect,
  myOrders
);


// ==========================================
// CREATE ORDER
// PAYMENT SCREENSHOT UPLOAD
// ==========================================

router.post(
  '/',
  uploadPaymentScreenshot.single(
    'paymentScreenshot'
  ),
  createOrder
);


// ==========================================
// ADMIN - VIEW PAYMENT SCREENSHOT
// ==========================================

router.get(
  '/:id/payment-screenshot',
  protect,
  adminOnly,
  getPaymentScreenshot
);


// ==========================================
// ADMIN - UPDATE ORDER STATUS
// ==========================================

router.patch(
  '/:id/status',
  protect,
  adminOnly,
  updateOrderStatus
);


// ==========================================
// ADMIN - VERIFY PAYMENT
// ==========================================

router.patch(
  '/:id/payment',
  protect,
  adminOnly,
  verifyPayment
);


export default router;