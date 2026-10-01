import crypto from 'crypto';
import * as XLSX from 'xlsx';

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

// ==========================================
// VALIDATION
// ==========================================

function validateFullName(name) {
  const value = String(name || '').trim();

  if (!value) {
    return 'Full name is required';
  }

  if (value.length < 2) {
    return 'Full name must contain at least 2 characters';
  }

  if (value.length > 60) {
    return 'Full name must not exceed 60 characters';
  }

  const pattern =
    /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]*$/u;

  if (!pattern.test(value)) {
    return 'Full name contains invalid characters';
  }

  return '';
}

function validateEmail(email) {
  const value = String(email || '').trim();

  if (!value) {
    return 'Customer email is required';
  }

  if (value.length > 254) {
    return 'Email address is too long';
  }

  const pattern =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

  if (!pattern.test(value)) {
    return 'Invalid email address';
  }

  return '';
}

function validatePhone(phone) {
  const value = String(phone || '').trim();

  if (!value) {
    return 'Contact number is required';
  }

  if (!/^\d{10}$/.test(value)) {
    return 'Contact number must contain exactly 10 digits';
  }

  if (!/^[6-9]\d{9}$/.test(value)) {
    return 'Invalid Indian mobile number';
  }

  return '';
}

// ==========================================
// CREATE ORDER
// ==========================================

export async function createOrder(req, res, next) {
  try {
    const {
      customerEmail,
      customerDetails,
      items
    } = req.body;

    const emailError = validateEmail(customerEmail);
    if (emailError) {
      return res.status(400).json({
        message: emailError
      });
    }

    const fullNameError = validateFullName(
      customerDetails?.fullName
    );

    if (fullNameError) {
      return res.status(400).json({
        message: fullNameError
      });
    }

    const phoneError = validatePhone(
      customerDetails?.phone
    );

    if (phoneError) {
      return res.status(400).json({
        message: phoneError
      });
    }

    if (!Array.isArray(items) || items.length !== 1) {
      return res.status(400).json({
        message:
          'Order must contain exactly one ACE T-Shirt'
      });
    }

    const item = items[0];

    if (
      !item?.product ||
      !item?.size
    ) {
      return res.status(400).json({
        message:
          'Product and size are required'
      });
    }

    // ACE STORE currently offers Collar only.
    const neckType = 'Collar';

    const product = await Product.findOne({
      _id: item.product,
      active: true
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    const selectedSize = String(
      item.size
    ).trim();

    if (
      !Array.isArray(product.sizes) ||
      !product.sizes.includes(selectedSize)
    ) {
      return res.status(400).json({
        message:
          'Invalid T-shirt size selected'
      });
    }

    const totalAmount = Number(
      Number(product.price).toFixed(2)
    );

    const order = await Order.create({
      user: req.user?._id,

      customerEmail:
        customerEmail.trim().toLowerCase(),

      customerDetails: {
        fullName:
          customerDetails.fullName.trim(),

        phone:
          customerDetails.phone.trim()
      },

      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          neckType,
          size: selectedSize
        }
      ],

      totalAmount,

      paymentMethod: 'UPI_MANUAL',

      paymentStatus: 'pending',

      orderStatus:
        'pending_payment_verification'
    });

    return res.status(201).json({
      order,

      message:
        'Order submitted successfully. Payment is pending verification.'
    });

  } catch (err) {
    next(err);
  }
}

// ==========================================
// MY ORDERS
// ==========================================

export async function myOrders(
  req,
  res,
  next
) {
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

// ==========================================
// ALL ORDERS
// ==========================================

export async function allOrders(
  req,
  res,
  next
) {
  try {
    const orders = await Order.find()
      .populate(
        'user',
        'name email'
      )
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

// ==========================================
// UPDATE ORDER STATUS
// ==========================================

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

// ==========================================
// VERIFY PAYMENT
// ==========================================

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
      !['approve', 'reject'].includes(
        action
      )
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

    if (
      order.paymentStatus !== 'pending'
    ) {
      return res.status(400).json({
        message:
          'This payment has already been processed'
      });
    }

    // ========================================
    // REJECT
    // ========================================

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
        message:
          'Payment rejected.'
      });
    }

    // ========================================
    // APPROVE
    // ========================================

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

    // ========================================
    // GENERATE INVOICE
    // ========================================

    let invoice = null;
    let invoiceGenerated = false;

    try {
      invoice =
        await createInvoice(order);

      invoiceGenerated = true;

    } catch (invoiceError) {
      console.error(
        'Invoice generation failed:',
        invoiceError
      );
    }

    // ========================================
    // RESPOND IMMEDIATELY
    // ========================================

    res.json({
      order,

      invoiceGenerated,

      emailSent: false,

      message:
        invoiceGenerated
          ? 'Payment approved and order moved to processing.'
          : 'Payment approved and order moved to processing. Invoice generation failed.'
    });

    // ========================================
    // SEND EMAIL IN BACKGROUND
    // ========================================

    if (invoice) {
      sendOrderEmail({
        to: order.customerEmail,
        order,
        invoice
      })
        .then((emailResult) => {
          if (emailResult?.skipped) {
            console.log(
              'Invoice email skipped:',
              emailResult.reason
            );
          } else {
            console.log(
              `Invoice email sent to ${order.customerEmail}`
            );
          }
        })
        .catch((emailError) => {
          console.error(
            'Invoice email failed:',
            emailError
          );
        });
    }

  } catch (err) {
    next(err);
  }
}

// ==========================================
// EXPORT ORDERS TO EXCEL
// ==========================================

export const exportOrders = async (
  req,
  res
) => {
  try {
    const filter =
      req.query.filter || 'all';

    const query = {};

    if (filter === 'paid') {
      query.paymentStatus = 'paid';
    }

    const orders =
      await Order.find(query)
        .populate(
          'items.product',
          'name'
        )
        .sort({
          createdAt: -1
        });

    const excelData =
      orders.map((order) => {
        const item =
          order.items?.[0] || {};

        return {
          'Order ID':
            order._id?.toString() || '',

          'Invoice Number':
            order.invoiceNumber || '',

          'Customer Name':
            order.customerDetails
              ?.fullName || '',

          'Email':
            order.customerEmail || '',

          'Phone':
            order.customerDetails
              ?.phone || '',

          'Product':
            item.name ||
            item.product?.name ||
            '',

          'Neck Type':
            item.neckType || '',

          'Size':
            item.size || '',

          'Amount':
            order.totalAmount || 0,

          'Payment Method':
            order.paymentMethod || '',

          'Payment Status':
            order.paymentStatus || '',

          'Order Status':
            order.orderStatus || '',

          'Order Date':
            order.createdAt
              ? new Date(
                  order.createdAt
                ).toLocaleString(
                  'en-IN'
                )
              : '',

          'Payment Verified At':
            order.paymentVerifiedAt
              ? new Date(
                  order.paymentVerifiedAt
                ).toLocaleString(
                  'en-IN'
                )
              : ''
        };
      });

    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );

    worksheet['!cols'] = [
      { wch: 26 },
      { wch: 28 },
      { wch: 22 },
      { wch: 30 },
      { wch: 16 },
      { wch: 22 },
      { wch: 15 },
      { wch: 10 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 25 },
      { wch: 24 },
      { wch: 24 }
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Orders'
    );

    const excelBuffer =
      XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx'
      });

    const fileName =
      filter === 'paid'
        ? 'ACE-Paid-Orders.xlsx'
        : 'ACE-All-Orders.xlsx';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    res.send(excelBuffer);

  } catch (error) {
    console.error(
      'Export orders error:',
      error
    );

    res.status(500).json({
      message:
        'Unable to export orders.'
    });
  }
};