import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const OFFICIAL_EMAIL =
  'rmdssoe.aces@sinhgad.edu';

function getGmailClient() {
  const clientId =
    process.env.GMAIL_CLIENT_ID;

  const clientSecret =
    process.env.GMAIL_CLIENT_SECRET;

  const refreshToken =
    process.env.GMAIL_REFRESH_TOKEN;

  if (
    !clientId ||
    !clientSecret ||
    !refreshToken
  ) {
    throw new Error(
      'Gmail API credentials are not configured.'
    );
  }

  const oauth2Client =
    new google.auth.OAuth2(
      clientId,
      clientSecret
    );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  return google.gmail({
    version: 'v1',
    auth: oauth2Client
  });
}

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function createMimeMessage({
  to,
  subject,
  text,
  html,
  attachment
}) {
  const transport =
    nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'unix'
    });

  const info =
    await transport.sendMail({
      from: `"ACE Store" <${OFFICIAL_EMAIL}>`,

      to,

      subject,

      text,

      html,

      attachments: attachment
        ? [
            {
              filename:
                attachment.filename,

              content:
                attachment.content,

              contentType:
                'application/pdf'
            }
          ]
        : []
    });

  return info.message;
}

export async function sendOrderEmail({
  to,
  order,
  invoice
}) {
  if (!to) {
    throw new Error(
      'Customer email address is missing.'
    );
  }

  const invoiceNumber =
    order.invoiceNumber ||
    order._id?.toString() ||
    'invoice';

  const customerName =
    order.customerDetails?.fullName ||
    'Customer';

  const amount =
    Number(
      order.totalAmount || 0
    ).toFixed(2);

  const subject =
    `ACE Store Invoice ${invoiceNumber}`;

  const text = [
    `Hello ${customerName},`,
    '',
    'Your ACE T-Shirt order has been approved and your payment has been verified.',
    '',
    `Invoice Number: ${invoiceNumber}`,
    `Order Amount: ₹${amount}`,
    '',
    'Your invoice is attached to this email.',
    '',
    'Regards,',
    'ACE Store',
    'ACE / Sinhgad Institute'
  ].join('\n');

  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #111;
      "
    >
      <h2>ACE Store — Order Confirmed</h2>

      <p>
        Hello ${customerName},
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
        ₹${amount}
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
  `;

  const mimeMessage =
    await createMimeMessage({
      to,
      subject,
      text,
      html,

      attachment: {
        filename:
          `${invoiceNumber}.pdf`,

        content: invoice
      }
    });

  const raw =
    toBase64Url(mimeMessage);

  const gmail =
    getGmailClient();

  const response =
    await gmail.users.messages.send({
      userId: 'me',

      requestBody: {
        raw
      }
    });

  console.log(
    `Gmail API invoice sent. Message ID: ${response.data.id}`
  );

  return {
    skipped: false,
    messageId: response.data.id
  };
}