import nodemailer from 'nodemailer';

function transporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

export async function sendOrderEmail({ to, order, invoice }) {
  const mailer = transporter();
  if (!mailer) return { skipped: true, reason: 'SMTP is not configured' };
  return mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: `SmartCart order ${order.invoiceNumber || order._id} confirmed`,
    text: `Your order has been confirmed. Total: ₹${order.totalAmount.toFixed(2)}. Your invoice is attached.`,
    attachments: [{ filename: `${order.invoiceNumber || 'invoice'}.pdf`, content: invoice }]
  });
}
