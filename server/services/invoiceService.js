import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logo should be here:
// server/assets/ace-logo.png
const LOGO_PATH = path.resolve(
  __dirname,
  '../assets/ace-logo.png'
);

const BLACK = '#111111';
const DARK = '#222222';
const MID = '#666666';
const LIGHT = '#F3F3F3';
const BORDER = '#D9D9D9';
const WHITE = '#FFFFFF';

// ==========================================
// HELPERS
// ==========================================

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function safe(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function roundedBox(
  doc,
  x,
  y,
  width,
  height,
  radius = 8,
  fill = WHITE,
  stroke = BORDER
) {
  doc
    .roundedRect(x, y, width, height, radius)
    .fillAndStroke(fill, stroke);
}

function label(doc, text, x, y) {
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(MID)
    .text(
      text.toUpperCase(),
      x,
      y,
      {
        characterSpacing: 0.6,
      }
    );
}

function value(
  doc,
  text,
  x,
  y,
  width = 210,
  size = 10
) {
  doc
    .font('Helvetica')
    .fontSize(size)
    .fillColor(DARK)
    .text(text, x, y, {
      width,
    });
}

// ==========================================
// CREATE INVOICE
// ==========================================

export function createInvoice(order) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,

    info: {
      Title: `ACE Store Invoice ${
        order.invoiceNumber || order._id
      }`,

      Author: 'ACE STORE',

      Subject: 'ACE Store Order Invoice',
    },
  });

  const chunks = [];

  doc.on('data', (chunk) => {
    chunks.push(chunk);
  });

  const done = new Promise(
    (resolve, reject) => {
      doc.on('end', () => {
        resolve(
          Buffer.concat(chunks)
        );
      });

      doc.on('error', reject);
    }
  );

  const page = {
    width: doc.page.width,
    height: doc.page.height,
    margin: 42,
  };

  const contentWidth =
    page.width - page.margin * 2;

  const right =
    page.width - page.margin;

  // ==========================================
  // HEADER
  // ==========================================

  doc
    .rect(
      0,
      0,
      page.width,
      92
    )
    .fill(BLACK);

  // ACE LOGO
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(
      LOGO_PATH,
      page.margin,
      16,
      {
        fit: [58, 58],

        align: 'center',

        valign: 'center',
      }
    );
  } else {
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor(WHITE)
      .text(
        'ACE',
        page.margin,
        33
      );
  }

  // STORE NAME
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(WHITE)
    .text(
      'ACE STORE',
      page.margin + 72,
      24
    );

  // SUBTITLE
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#CFCFCF')
    .text(
      'OFFICIAL ACE MERCHANDISE',
      page.margin + 72,
      51
    );

  // INVOICE TITLE
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(WHITE)
    .text(
      'INVOICE',
      right - 160,
      25,
      {
        width: 160,
        align: 'right',
      }
    );

  // INVOICE NUMBER
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#CFCFCF')
    .text(
      `Invoice No.  ${safe(
        order.invoiceNumber,
        order._id
      )}`,
      right - 200,
      48,
      {
        width: 200,
        align: 'right',
      }
    );

  // ISSUE DATE
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#CFCFCF')
    .text(
      `Issued  ${formatDate(
        order.createdAt
      )}`,
      right - 200,
      63,
      {
        width: 200,
        align: 'right',
      }
    );

  // ==========================================
  // CUSTOMER + PAYMENT DETAILS
  // ==========================================

  const detailsY = 116;

  const half =
    (contentWidth - 14) / 2;

  roundedBox(
    doc,
    page.margin,
    detailsY,
    half,
    112,
    8,
    LIGHT,
    BORDER
  );

  roundedBox(
    doc,
    page.margin + half + 14,
    detailsY,
    half,
    112,
    8,
    WHITE,
    BORDER
  );

  // ------------------------------------------
  // BILL TO
  // ------------------------------------------

  label(
    doc,
    'Billed To',
    page.margin + 16,
    detailsY + 16
  );

  const customerName = safe(
    order.customerDetails?.fullName,
    'Customer'
  );

  const customerEmail = safe(
    order.customerEmail
  );

  const customerPhone = safe(
    order.customerDetails?.phone
  );

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(BLACK)
    .text(
      customerName,
      page.margin + 16,
      detailsY + 36,
      {
        width: half - 32,
      }
    );

  value(
    doc,
    customerEmail,
    page.margin + 16,
    detailsY + 59,
    half - 32,
    9.5
  );

  value(
    doc,
    `Phone: ${customerPhone}`,
    page.margin + 16,
    detailsY + 77,
    half - 32,
    9.5
  );

  // ------------------------------------------
  // PAYMENT
  // ------------------------------------------

  const statusX =
    page.margin + half + 30;

  label(
    doc,
    'Payment',
    statusX,
    detailsY + 16
  );

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(BLACK)
    .text(
      'PAID',
      statusX,
      detailsY + 37
    );

  label(
    doc,
    'Method',
    statusX + 84,
    detailsY + 16
  );

  value(
    doc,
    'UPI - Manual Verification',
    statusX + 84,
    detailsY + 37,
    half - 100,
    9.5
  );

  label(
    doc,
    'Order Status',
    statusX,
    detailsY + 67
  );

  value(
    doc,
    String(
      order.orderStatus ||
        'processing'
    ).toUpperCase(),
    statusX,
    detailsY + 86,
    half - 32,
    9.5
  );

  // ==========================================
  // ITEMS TABLE
  // ==========================================

  const items = Array.isArray(
    order.items
  )
    ? order.items
    : [];

  const item = items[0] || {};

  const tableY = 252;

  const headerH = 32;

  const rowH = 45;

  // TABLE HEADER
  doc
    .rect(
      page.margin,
      tableY,
      contentWidth,
      headerH
    )
    .fill(BLACK);

  // COLUMN POSITIONS
  const col = {
    desc: page.margin + 14,

    style: page.margin + 285,

    size: page.margin + 355,

    qty: page.margin + 400,

    price: page.margin + 445,

    amount: right - 14,
  };

  // TABLE HEADER TEXT
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(WHITE);

  doc.text(
    'ITEM',
    col.desc,
    tableY + 11
  );

  doc.text(
    'STYLE',
    col.style,
    tableY + 11
  );

  doc.text(
    'SIZE',
    col.size,
    tableY + 11
  );

  doc.text(
    'QTY',
    col.qty,
    tableY + 11,
    {
      width: 25,
      align: 'center',
    }
  );

  doc.text(
    'PRICE',
    col.price,
    tableY + 11,
    {
      width: 60,
      align: 'right',
    }
  );

  doc.text(
    'AMOUNT',
    right - 62,
    tableY + 11,
    {
      width: 48,
      align: 'right',
    }
  );

  // TABLE ROW
  doc
    .rect(
      page.margin,
      tableY + headerH,
      contentWidth,
      rowH
    )
    .fill(WHITE)
    .stroke(BORDER);

  // PRODUCT NAME
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(BLACK)
    .text(
      safe(
        item.name,
        'ACE T-Shirt'
      ),
      col.desc,
      tableY + headerH + 10,
      {
        width: 245,
      }
    );

  // SMALL DESCRIPTION
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(MID)
    .text(
      'Official ACE merchandise',
      col.desc,
      tableY + headerH + 27,
      {
        width: 245,
      }
    );

  // STYLE
  doc
    .fontSize(9)
    .fillColor(DARK)
    .text(
      safe(
        item.neckType,
        'Collar'
      ),
      col.style,
      tableY + headerH + 17
    );

  // SIZE
  doc.text(
    safe(item.size),
    col.size,
    tableY + headerH + 17
  );

  // QTY
  doc.text(
    '1',
    col.qty,
    tableY + headerH + 17,
    {
      width: 25,
      align: 'center',
    }
  );

  // PRICE
  doc.text(
    money(item.price),
    col.price,
    tableY + headerH + 17,
    {
      width: 60,
      align: 'right',
    }
  );

  // AMOUNT
  doc.text(
    money(order.totalAmount),
    right - 62,
    tableY + headerH + 17,
    {
      width: 48,
      align: 'right',
    }
  );

  // ==========================================
  // TOTAL
  // ==========================================

  const totalY =
    tableY +
    headerH +
    rowH +
    26;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(MID)
    .text(
      'Payment verified by ACE administration.',
      page.margin,
      totalY + 4,
      {
        width: 300,
      }
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(DARK)
    .text(
      'TOTAL',
      right - 180,
      totalY,
      {
        width: 75,
        align: 'right',
      }
    );

  // TOTAL BOX
  doc
    .rect(
      right - 96,
      totalY - 8,
      96,
      40
    )
    .fill(BLACK);

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(WHITE)
    .text(
      money(order.totalAmount),
      right - 88,
      totalY + 6,
      {
        width: 80,
        align: 'right',
      }
    );

  // ==========================================
  // FOOTER
  // ==========================================

  const footerY =
    page.height - 94;

  doc
    .moveTo(
      page.margin,
      footerY
    )
    .lineTo(
      right,
      footerY
    )
    .stroke(BORDER);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(BLACK)
    .text(
      'Thank you for supporting ACE!',
      page.margin,
      footerY + 18
    );

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(MID)
    .text(
      'ACE STORE  |  Official ACE Merchandise  |  rmdssoe.aces@sinhgad.edu',
      page.margin,
      footerY + 37,
      {
        width: contentWidth,
      }
    );

  doc
    .fontSize(7.5)
    .fillColor('#8A8A8A')
    .text(
      'This is a computer-generated invoice. No signature is required.',
      page.margin,
      footerY + 56
    );

  // ==========================================
  // FINISH
  // ==========================================

  doc.end();

  return done;
}