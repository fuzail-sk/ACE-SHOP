import crypto from 'crypto';

import Product from '../models/Product.js';
import Order from '../models/Order.js';

import { createInvoice } from '../services/invoiceService.js';
import { sendOrderEmail } from '../services/emailService.js';

const ALLOWED_ORDER_STATUSES = [
  'pending_payment_verification',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
];

export async function createOrder(req, res, next) {
  try {
    const {
      customerEmail,
      customerDetails,
      items
    } = req.body;

    if (!customerEmail) {
      return res.status(400).json({
        message: 'Customer email is required'
      });
    }

    if (
      !customerDetails?.fullName ||
      !customerDetails?.phone
    ) {
      return res.status(400).json({
        message: 'Full name and phone number are required'
      });
    }

    if (!Array.isArray(items) || items.length !== 1) {
      return res.status(400).json({
        message: 'Order must contain exactly one ACE T-Shirt'
      });
    }

    const item = items[0];

    if (
      !item?.product ||
      !item?.gender ||
      !item?.neckType ||
      !item?.size
    ) {
      return res.status(400).json({
        message: 'Product, gender, neck type and size are required'
      });
    }

    if (!['Male', 'Female'].includes(item.gender)) {
      return res.status(400).json({
        message: 'Invalid gender selected'
      });
    }

    const expectedNeckType =
      item.gender === 'Male'
        ? 'Collar'
        : 'Round Neck';

    if (item.neckType !== expectedNeckType) {
      return res.status(400).json({
        message: 'Invalid neck type for selected gender'
      });
    }

    const product = await Product.findOne({
      _id: item.product,
      active: true
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const selectedSize = String(item.size).trim();

    if (
      !product.sizes.length ||
      !product.sizes.includes(selectedSize)
    ) {
      return res.status(400).json({
        message: 'Invalid T-shirt size selected'
      });
    }

    const totalAmount = Number(
      product.price.toFixed(2)
    );

    const order = await Order.create({
      user: req.user?._id,

      customerEmail,

      customerDetails: {
        fullName: customerDetails.fullName,
        phone: customerDetails.phone
      },

      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          gender: item.gender,
          neckType: item.neckType,
          size: selectedSize
        }
      ],

      totalAmount,

      paymentMethod: 'UPI_MANUAL',

      paymentStatus: 'pending',

      orderStatus: 'pending_payment_verification'
    });

    res.status(201).json({
      order,

      message:
        'Order submitted successfully. Payment is pending verification.'
    });
  } catch (err) {
    next(err);
  }
}

export async function myOrders(req, res, next) {
  try {
    const orders = await Order.find({
      user: req.user._id
    }).sort({
      createdAt: -1
    });

    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export async function allOrders(req, res, next) {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate(
        'paymentVerifiedBy',
        'name email'
      )
      .sort({
        createdAt: -1
      });

    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(
  req,
  res,
  next
) {
  try {
    const { orderStatus } = req.body;

    if (
      !ALLOWED_ORDER_STATUSES.includes(
        orderStatus
      )
    ) {
      return res.status(400).json({
        message: 'Invalid order status'
      });
    }

    const order =
      await Order.findByIdAndUpdate(
        req.params.id,
        { orderStatus },
        {
          new: true,
          runValidators: true
        }
      );

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(
  req,
  res,
  next
) {
  try {
    const {
      action,
      rejectionReason
    } = req.body;

    if (
      !['approve', 'reject'].includes(action)
    ) {
      return res.status(400).json({
        message:
          'Action must be approve or reject'
      });
    }

    const order =
      await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({
        message:
          'This payment has already been processed'
      });
    }

    if (action === 'reject') {
      order.paymentStatus = 'failed';

      order.orderStatus = 'cancelled';

      order.paymentVerifiedAt =
        new Date();

      order.paymentVerifiedBy =
        req.user._id;

      order.paymentRejectionReason =
        rejectionReason?.trim() ||
        'Payment could not be verified.';

      await order.save();

      return res.json({
        order,
        message: 'Payment rejected.'
      });
    }

    order.invoiceNumber =
      `ACE-${Date.now()}-${crypto
        .randomBytes(3)
        .toString('hex')
        .toUpperCase()}`;

    order.paymentStatus = 'paid';

    order.orderStatus = 'processing';

    order.paymentVerifiedAt =
      new Date();

    order.paymentVerifiedBy =
      req.user._id;

    order.paymentRejectionReason =
      undefined;

    await order.save();

    const invoice =
      await createInvoice(order);

    const emailResult =
      await sendOrderEmail({
        to: order.customerEmail,
        order,
        invoice
      });

    res.json({
      order,

      emailSent:
        !emailResult?.skipped,

      message:
        emailResult?.skipped
          ? 'Payment approved and invoice generated. Email is not configured yet.'
          : 'Payment approved, invoice generated and email sent.'
    });
  } catch (err) {
    next(err);
  }
}