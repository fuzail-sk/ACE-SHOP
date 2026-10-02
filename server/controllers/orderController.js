import crypto from 'crypto';
import * as XLSX from 'xlsx';

import Product from '../models/Product.js';
import Order from '../models/Order.js';

import { createInvoice } from '../services/invoiceService.js';
import { sendOrderEmail } from '../services/emailService.js';


// ==========================================
// ALLOWED ORDER STATUSES
// ==========================================

const ALLOWED_ORDER_STATUSES = [
  'pending_payment_verification',
  'accepted',
  'shipped',
  'delivered',
  'cancelled'
];


// ==========================================
// CREATE ORDER
// ==========================================

export async function createOrder(req, res, next) {
  try {
    const {
      customerEmail,
      customerDetails: customerDetailsRaw,
      items: itemsRaw
    } = req.body;


    // --------------------------------------
    // CUSTOMER EMAIL
    // --------------------------------------

    if (!customerEmail) {
      return res.status(400).json({
        message: 'Customer email is required'
      });
    }


    // --------------------------------------
    // PARSE MULTIPART JSON FIELDS
    // --------------------------------------

    let customerDetails;
    let items;

    try {
      customerDetails =
        typeof customerDetailsRaw === 'string'
          ? JSON.parse(customerDetailsRaw)
          : customerDetailsRaw;

      items =
        typeof itemsRaw === 'string'
          ? JSON.parse(itemsRaw)
          : itemsRaw;
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid order data submitted'
      });
    }


    // --------------------------------------
    // CUSTOMER DETAILS
    // --------------------------------------

    if (
      !customerDetails?.fullName ||
      !customerDetails?.phone
    ) {
      return res.status(400).json({
        message:
          'Full name and phone number are required'
      });
    }


    // --------------------------------------
    // PAYMENT SCREENSHOT
    // --------------------------------------

    if (!req.file) {
      return res.status(400).json({
        message:
          'Payment screenshot is required'
      });
    }


    // --------------------------------------
    // ORDER ITEMS
    // --------------------------------------

    if (
      !Array.isArray(items) ||
      items.length !== 1
    ) {
      return res.status(400).json({
        message:
          'Order must contain exactly one ACE T-Shirt'
      });
    }


    const item = items[0];


    // --------------------------------------
    // ITEM VALIDATION
    // --------------------------------------

    if (
      !item?.product ||
      !item?.neckType ||
      !item?.size
    ) {
      return res.status(400).json({
        message:
          'Product, neck type and size are required'
      });
    }


    // --------------------------------------
    // COLLAR ONLY
    // --------------------------------------

    if (item.neckType !== 'Collar') {
      return res.status(400).json({
        message:
          'Only Collar T-Shirts are available'
      });
    }


    // --------------------------------------
    // GET PRODUCT
    // --------------------------------------

    const product = await Product.findOne({
      _id: item.product,
      active: true
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }


    // --------------------------------------
    // VALIDATE SIZE
    // --------------------------------------

    const selectedSize =
      String(item.size).trim();

    if (
      !product.sizes?.length ||
      !product.sizes.includes(selectedSize)
    ) {
      return res.status(400).json({
        message:
          'Invalid T-shirt size selected'
      });
    }


    // --------------------------------------
    // TOTAL FROM DATABASE
    // --------------------------------------

    const totalAmount = Number(
      product.price.toFixed(2)
    );


    // --------------------------------------
    // CREATE ORDER
    // --------------------------------------

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

          neckType: 'Collar',

          size: selectedSize
        }
      ],

      totalAmount,

      paymentMethod: 'UPI_MANUAL',

      paymentStatus: 'pending',

      orderStatus:
        'pending_payment_verification',

      paymentScreenshot: {
        data: req.file.buffer,

        contentType:
          req.file.mimetype,

        originalName:
          req.file.originalname,

        uploadedAt: new Date()
      }
    });


    // --------------------------------------
    // SAFE RESPONSE
    // --------------------------------------

    const safeOrder =
      order.toObject();

    if (
      safeOrder.paymentScreenshot
    ) {
      delete safeOrder
        .paymentScreenshot.data;
    }


    // --------------------------------------
    // RESPONSE
    // --------------------------------------

    return res.status(201).json({
      order: safeOrder,

      message:
        'Order submitted successfully. Payment is pending verification.'
    });

  } catch (err) {
    next(err);
  }
}


// ==========================================
// USER - MY ORDERS
// ==========================================

export async function myOrders(
  req,
  res,
  next
) {
  try {
    const orders =
      await Order.find({
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
// ADMIN - ALL ORDERS
// ==========================================

export async function allOrders(
  req,
  res,
  next
) {
  try {
    const orders =
      await Order.find()
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
// ADMIN - UPDATE ORDER STATUS
// ==========================================

export async function updateOrderStatus(
  req,
  res,
  next
) {
  try {
    const {
      orderStatus
    } = req.body;

    if (
      !ALLOWED_ORDER_STATUSES.includes(
        orderStatus
      )
    ) {
      return res.status(400).json({
        message:
          'Invalid order status'
      });
    }

    const order =
      await Order.findByIdAndUpdate(
        req.params.id,
        {
          orderStatus
        },
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
// ADMIN - VERIFY PAYMENT
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


    // --------------------------------------
    // VALIDATE ACTION
    // --------------------------------------

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


    // --------------------------------------
    // FIND ORDER
    // --------------------------------------

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }


    // --------------------------------------
    // CHECK PAYMENT STATUS
    // --------------------------------------

    if (
      order.paymentStatus !==
      'pending'
    ) {
      return res.status(400).json({
        message:
          'This payment has already been processed'
      });
    }


    // --------------------------------------
    // REJECT PAYMENT
    // --------------------------------------

    if (action === 'reject') {
      order.paymentStatus =
        'failed';

      order.orderStatus =
        'cancelled';

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


    // --------------------------------------
    // APPROVE PAYMENT
    // --------------------------------------

    order.invoiceNumber =
      `ACE-${Date.now()}-${crypto
        .randomBytes(3)
        .toString('hex')
        .toUpperCase()}`;

    order.paymentStatus =
      'paid';

   order.orderStatus = 'accepted';

    order.paymentVerifiedAt =
      new Date();

    order.paymentVerifiedBy =
      req.user._id;

    order.paymentRejectionReason =
      undefined;

    await order.save();


    // --------------------------------------
    // CREATE INVOICE
    // --------------------------------------

    const invoice =
      await createInvoice(order);


    // --------------------------------------
    // SEND EMAIL
    // --------------------------------------

    const emailResult =
      await sendOrderEmail({
        to: order.customerEmail,
        order,
        invoice
      });


    // --------------------------------------
    // RESPONSE
    // --------------------------------------

    return res.json({
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


// ==========================================
// ADMIN - VIEW PAYMENT SCREENSHOT
// ==========================================

export async function getPaymentScreenshot(
  req,
  res,
  next
) {
  try {
    const order =
      await Order.findById(
        req.params.id
      ).select(
        '+paymentScreenshot.data'
      );


    // --------------------------------------
    // ORDER NOT FOUND
    // --------------------------------------

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }


    // --------------------------------------
    // SCREENSHOT NOT FOUND
    // --------------------------------------

    const screenshot =
      order.paymentScreenshot;

    if (!screenshot?.data) {
      return res.status(404).json({
        message:
          'Payment screenshot not found'
      });
    }


    // --------------------------------------
    // NORMALIZE BUFFER
    // --------------------------------------

    let imageBuffer;

    if (
      Buffer.isBuffer(
        screenshot.data
      )
    ) {
      imageBuffer =
        screenshot.data;

    } else if (
      screenshot.data?.buffer &&
      Buffer.isBuffer(
        screenshot.data.buffer
      )
    ) {
      imageBuffer =
        screenshot.data.buffer;

    } else {
      imageBuffer =
        Buffer.from(
          screenshot.data
        );
    }


    // --------------------------------------
    // EMPTY FILE CHECK
    // --------------------------------------

    if (!imageBuffer.length) {
      return res.status(404).json({
        message:
          'Payment screenshot is empty'
      });
    }


    // --------------------------------------
    // RESPONSE HEADERS
    // --------------------------------------

    const contentType =
      screenshot.contentType ||
      'image/jpeg';

    const originalName =
      (
        screenshot.originalName ||
        'payment-screenshot.jpg'
      ).replace(
        /"/g,
        ''
      );


    res.status(200);

    res.setHeader(
      'Content-Type',
      contentType
    );

    res.setHeader(
      'Content-Length',
      imageBuffer.length
    );

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${originalName}"`
    );


    // --------------------------------------
    // SEND IMAGE
    // --------------------------------------

    return res.end(
      imageBuffer
    );

  } catch (err) {
    console.error(
      'Payment screenshot error:',
      err
    );

    next(err);
  }
}


// ==========================================
// EXPORT ORDERS TO EXCEL
// ==========================================

export const exportOrders =
  async (
    req,
    res
  ) => {
    try {
      const filter =
        req.query.filter ||
        'all';


      // ------------------------------------
      // FILTER
      // ------------------------------------

      let query = {};

      if (
        filter === 'paid'
      ) {
        query.paymentStatus =
          'paid';
      }


      // ------------------------------------
      // GET ORDERS
      // ------------------------------------

      const orders =
        await Order.find(
          query
        )
          .populate(
            'items.product',
            'name'
          )
          .sort({
            createdAt: -1
          });


      // ------------------------------------
      // EXCEL DATA
      // ------------------------------------

      const excelData =
        orders.map(
          (order) => {
            const item =
              order.items?.[0] ||
              {};

            return {
              'Order ID':
                order._id
                  ?.toString() ||
                '',

              'Invoice Number':
                order.invoiceNumber ||
                '',

              'Customer Name':
                order
                  .customerDetails
                  ?.fullName ||
                '',

              'Email':
                order.customerEmail ||
                '',

              'Phone':
                order
                  .customerDetails
                  ?.phone ||
                '',

              'Product':
                item.name ||
                item.product?.name ||
                '',

              'Neck Type':
                item.neckType ||
                '',

              'Size':
                item.size ||
                '',

              'Amount':
                order.totalAmount ||
                0,

              'Payment Method':
                order.paymentMethod ||
                '',

              'Payment Status':
                order.paymentStatus ||
                '',

              'Order Status':
                order.orderStatus ||
                '',

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
          }
        );


      // ------------------------------------
      // WORKSHEET
      // ------------------------------------

      const worksheet =
        XLSX.utils.json_to_sheet(
          excelData
        );


      // ------------------------------------
      // COLUMN WIDTHS
      // ------------------------------------

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


      // ------------------------------------
      // WORKBOOK
      // ------------------------------------

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Orders'
      );


      // ------------------------------------
      // CREATE BUFFER
      // ------------------------------------

      const excelBuffer =
        XLSX.write(
          workbook,
          {
            type: 'buffer',
            bookType: 'xlsx'
          }
        );


      // ------------------------------------
      // FILE NAME
      // ------------------------------------

      const fileName =
        filter === 'paid'
          ? 'ACE-Paid-Orders.xlsx'
          : 'ACE-All-Orders.xlsx';


      // ------------------------------------
      // RESPONSE
      // ------------------------------------

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
      );

      res.send(
        excelBuffer
      );

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