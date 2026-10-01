import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const OFFICIAL_EMAIL =
  'rmdssoe.aces@sinhgad.edu';

const STORE_URL =
  'https://ace-shop-two.vercel.app';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

  const item =
    order.items?.[0] || {};

  const productName =
    item.name || 'ACE T-Shirt';

  const size =
    item.size || '-';

  const style =
    item.neckType || 'Collar';

  const orderDate =
    order.createdAt
      ? new Date(
          order.createdAt
        ).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : new Date().toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }
        );

  const safeName =
    escapeHtml(customerName);

  const safeInvoice =
    escapeHtml(invoiceNumber);

  const safeProduct =
    escapeHtml(productName);

  const safeSize =
    escapeHtml(size);

  const safeStyle =
    escapeHtml(style);

  const subject =
    `ACE Store | Order Confirmed | ${invoiceNumber}`;

  const text = [
    `ACE STORE`,
    '',
    `ORDER CONFIRMED`,
    '',
    `Hello ${customerName},`,
    '',
    'Your ACE T-Shirt order has been approved and your payment has been successfully verified.',
    '',
    `Invoice Number: ${invoiceNumber}`,
    `Order Date: ${orderDate}`,
    `Product: ${productName}`,
    `Style: ${style}`,
    `Size: ${size}`,
    `Amount: ₹${amount}`,
    `Payment Status: PAID`,
    '',
    'Your official invoice is attached to this email.',
    '',
    'Thank you for supporting ACE.',
    '',
    'ACE Store',
    'ACE / Sinhgad Institute',
    OFFICIAL_EMAIL
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>ACE Store Order Confirmation</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f4f4;
    font-family:Arial,Helvetica,sans-serif;
    color:#111111;
  "
>
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f4f4f4;padding:32px 12px;"
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:620px;
            background:#ffffff;
            border:1px solid #dddddd;
          "
        >

          <!-- HEADER -->

          <tr>
            <td
              style="
                background:#000000;
                padding:28px 32px;
              "
            >
              <div
                style="
                  color:#ffffff;
                  font-size:25px;
                  font-weight:900;
                  letter-spacing:2px;
                "
              >
                ACE STORE
              </div>

              <div
                style="
                  color:#bdbdbd;
                  font-size:12px;
                  margin-top:6px;
                  letter-spacing:1px;
                "
              >
                OFFICIAL ACE MERCHANDISE
              </div>
            </td>
          </tr>

          <!-- MAIN -->

          <tr>
            <td
              style="
                padding:36px 32px 20px;
              "
            >

              <div
                style="
                  display:inline-block;
                  background:#000000;
                  color:#ffffff;
                  padding:7px 12px;
                  font-size:11px;
                  font-weight:700;
                  letter-spacing:1px;
                "
              >
                PAYMENT CONFIRMED
              </div>

              <h1
                style="
                  margin:20px 0 8px;
                  font-size:30px;
                  line-height:1.2;
                  color:#111111;
                "
              >
                Order Confirmed
              </h1>

              <p
                style="
                  margin:0;
                  font-size:15px;
                  line-height:1.6;
                  color:#555555;
                "
              >
                Hello ${safeName},
              </p>

              <p
                style="
                  margin:18px 0 0;
                  font-size:15px;
                  line-height:1.7;
                  color:#333333;
                "
              >
                Thank you for supporting ACE.
                Your payment has been verified and
                your order is now being processed.
              </p>

            </td>
          </tr>

          <!-- ORDER INFORMATION -->

          <tr>
            <td
              style="
                padding:0 32px 24px;
              "
            >

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  border:1px solid #dddddd;
                "
              >

                <tr>
                  <td
                    colspan="2"
                    style="
                      padding:16px;
                      border-bottom:1px solid #dddddd;
                      font-size:12px;
                      font-weight:700;
                      letter-spacing:1px;
                      color:#666666;
                    "
                  >
                    ORDER DETAILS
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:13px 16px;
                      font-size:13px;
                      color:#777777;
                    "
                  >
                    Invoice Number
                  </td>

                  <td
                    align="right"
                    style="
                      padding:13px 16px;
                      font-size:13px;
                      font-weight:700;
                      color:#111111;
                    "
                  >
                    ${safeInvoice}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:13px 16px;
                      font-size:13px;
                      color:#777777;
                    "
                  >
                    Order Date
                  </td>

                  <td
                    align="right"
                    style="
                      padding:13px 16px;
                      font-size:13px;
                      color:#111111;
                    "
                  >
                    ${orderDate}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:13px 16px;
                      font-size:13px;
                      color:#777777;
                    "
                  >
                    Payment
                  </td>

                  <td
                    align="right"
                    style="
                      padding:13px 16px;
                      font-size:13px;
                      font-weight:700;
                      color:#111111;
                    "
                  >
                    UPI · PAID
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:13px 16px;
                      font-size:13px;
                      color:#777777;
                    "
                  >
                    Order Status
                  </td>

                  <td
                    align="right"
                    style="
                      padding:13px 16px;
                      font-size:13px;
                      font-weight:700;
                      color:#111111;
                    "
                  >
                    PROCESSING
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- PRODUCT -->

          <tr>
            <td
              style="
                padding:0 32px 24px;
              "
            >

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  border:1px solid #dddddd;
                "
              >

                <tr>
                  <td
                    style="
                      padding:16px;
                      border-bottom:1px solid #dddddd;
                      font-size:12px;
                      font-weight:700;
                      letter-spacing:1px;
                      color:#666666;
                    "
                  >
                    ITEM
                  </td>

                  <td
                    align="right"
                    style="
                      padding:16px;
                      border-bottom:1px solid #dddddd;
                      font-size:12px;
                      font-weight:700;
                      letter-spacing:1px;
                      color:#666666;
                    "
                  >
                    AMOUNT
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:18px 16px;
                    "
                  >
                    <div
                      style="
                        font-size:15px;
                        font-weight:700;
                        color:#111111;
                      "
                    >
                      ${safeProduct}
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:12px;
                        color:#777777;
                      "
                    >
                      Style: ${safeStyle}
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      Size: ${safeSize}
                    </div>
                  </td>

                  <td
                    align="right"
                    style="
                      padding:18px 16px;
                      font-size:15px;
                      font-weight:700;
                      color:#111111;
                    "
                  >
                    ₹${amount}
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- TOTAL -->

          <tr>
            <td
              style="
                padding:0 32px 28px;
              "
            >

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td
                    style="
                      padding:18px 16px;
                      background:#000000;
                      color:#ffffff;
                      font-size:14px;
                      font-weight:700;
                    "
                  >
                    TOTAL PAID
                  </td>

                  <td
                    align="right"
                    style="
                      padding:18px 16px;
                      background:#000000;
                      color:#ffffff;
                      font-size:20px;
                      font-weight:900;
                    "
                  >
                    ₹${amount}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- INVOICE NOTICE -->

          <tr>
            <td
              style="
                padding:0 32px 32px;
              "
            >

              <div
                style="
                  padding:18px;
                  background:#f7f7f7;
                  border-left:4px solid #000000;
                  font-size:13px;
                  line-height:1.6;
                  color:#444444;
                "
              >
                <strong
                  style="color:#111111;"
                >
                  Your invoice is attached.
                </strong>

                <br />

                Please keep the attached PDF
                invoice for your records.
              </div>

            </td>
          </tr>

          <!-- CTA -->

          <tr>
            <td
              align="center"
              style="
                padding:0 32px 38px;
              "
            >

              <a
                href="${STORE_URL}"
                style="
                  display:inline-block;
                  background:#000000;
                  color:#ffffff;
                  text-decoration:none;
                  padding:14px 24px;
                  font-size:13px;
                  font-weight:700;
                  letter-spacing:.5px;
                "
              >
                VISIT ACE STORE
              </a>

            </td>
          </tr>

          <!-- FOOTER -->

          <tr>
            <td
              align="center"
              style="
                border-top:1px solid #dddddd;
                padding:24px 32px;
              "
            >

              <div
                style="
                  font-size:13px;
                  font-weight:700;
                  color:#111111;
                "
              >
                ACE STORE
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:11px;
                  line-height:1.6;
                  color:#888888;
                "
              >
                ACE / Sinhgad Institute
                <br />
                ${OFFICIAL_EMAIL}
              </div>

              <div
                style="
                  margin-top:12px;
                  font-size:10px;
                  color:#aaaaaa;
                "
              >
                This is an automated order confirmation.
                Please do not reply to this email.
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
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