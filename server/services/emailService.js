import nodemailer from 'nodemailer';

const OFFICIAL_EMAIL = 'rmdssoe.aces@sinhgad.edu';

function transporter() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOrderEmail({
  to,
  order,
  invoice,
}) {
  const mailer = transporter();

  if (!mailer) {
    return {
      skipped: true,
      reason: 'SMTP is not configured',
    };
  }

  const invoiceNumber =
    order.invoiceNumber ||
    order._id?.toString() ||
    'invoice';

  return mailer.sendMail({
    from: `"ACE Store" <${OFFICIAL_EMAIL}>`,

    to,

    subject: `ACE Store Invoice ${invoiceNumber}`,

    text: [
      `Hello ${
        order.customerDetails?.fullName ||
        'Customer'
      },`,

      '',

      'Your ACE T-Shirt order has been approved and your payment has been verified.',

      '',

      `Invoice Number: ${invoiceNumber}`,

      `Order Amount: ₹${Number(
        order.totalAmount || 0
      ).toFixed(2)}`,

      '',

      'Your invoice is attached to this email.',

      '',

      'Regards,',

      'ACE Store',

      'ACE / Sinhgad Institute',
    ].join('\n'),

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
        "
      >
        <h2>ACE Store — Order Confirmed</h2>

        <p>
          Hello ${
            order.customerDetails?.fullName ||
            'Customer'
          },
        </p>

        <p>
          Your ACE T-Shirt order has been approved
          and your payment has been verified
          successfully.
        </p>

        <p>
          <strong>Invoice Number:</strong>
          ${invoiceNumber}
          <br />

          <strong>Order Amount:</strong>
          ₹${Number(
            order.totalAmount || 0
          ).toFixed(2)}
        </p>

        <p>
          Your invoice is attached to this email.
        </p>

        <p>
          Regards,<br />

          <strong>ACE Store</strong><br />

          ACE / Sinhgad Institute
        </p>
      </div>
    `,

    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: invoice,
      },
    ],
  });
}