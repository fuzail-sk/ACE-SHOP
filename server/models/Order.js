import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    customerDetails: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },

        name: {
          type: String,
          required: true,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        neckType: {
          type: String,
          enum: ['Collar'],
          required: true,
          default: 'Collar',
        },

        size: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ['UPI_MANUAL'],
      default: 'UPI_MANUAL',
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },

    orderStatus: {
      type: String,
      enum: [
        'pending_payment_verification',
        'accepted',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending_payment_verification',
    },

    // ==========================================
    // PAYMENT SCREENSHOT
    // ==========================================

    paymentScreenshot: {
      data: {
        type: Buffer,
        select: false,
      },

      contentType: {
        type: String,
        trim: true,
      },

      originalName: {
        type: String,
        trim: true,
      },

      uploadedAt: {
        type: Date,
      },
    },

    paymentVerifiedAt: {
      type: Date,
    },

    paymentVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    paymentRejectionReason: {
      type: String,
      trim: true,
    },

    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Order', orderSchema);