import PDFDocument from 'pdfkit';


export function createInvoice(order) {

  const doc = new PDFDocument({
    margin: 50
  });


  const chunks = [];


  doc.on(
    'data',
    chunk => chunks.push(chunk)
  );


  const done = new Promise(
    (resolve, reject) => {

      doc.on(
        'end',
        () =>
          resolve(
            Buffer.concat(chunks)
          )
      );

      doc.on(
        'error',
        reject
      );
    }
  );


  // ==========================================================
  // HEADER
  // ==========================================================

  doc
    .fontSize(22)
    .text(
      'ACE STORE',
      {
        align: 'center'
      }
    );


  doc
    .moveDown()
    .fontSize(16)
    .text(
      `Invoice ${
        order.invoiceNumber ||
        order._id
      }`
    );


  doc
    .fontSize(10)
    .text(
      `Date: ${
        new Date(
          order.createdAt
        ).toLocaleString()
      }`
    );


  doc.moveDown();


  // ==========================================================
  // CUSTOMER
  // ==========================================================

  doc.text(
    `Customer: ${
      order.shippingAddress
        ?.fullName ||
      'Customer'
    }`
  );


  doc.text(
    `${
      order.shippingAddress
        ?.address || ''
    }, ${
      order.shippingAddress
        ?.city || ''
    }, ${
      order.shippingAddress
        ?.state || ''
    } - ${
      order.shippingAddress
        ?.postalCode || ''
    }`
  );


  if (
    order.shippingAddress?.phone
  ) {
    doc.text(
      `Phone: ${
        order.shippingAddress.phone
      }`
    );
  }


  doc.moveDown();


  // ==========================================================
  // PRODUCT
  // ==========================================================

  order.items.forEach(
    item => {

      doc.text(
        `${item.name} — Size ${
          item.size
        }    ₹${Number(
          item.price
        ).toFixed(2)}`
      );

    }
  );


  doc.moveDown();


  // ==========================================================
  // TOTAL
  // ==========================================================

  doc
    .fontSize(14)
    .text(
      `Total: ₹${Number(
        order.totalAmount
      ).toFixed(2)}`
    );


  doc
    .moveDown()
    .fontSize(10)
    .text(
      'Thank you for supporting ACE!',
      {
        align: 'center'
      }
    );


  doc.end();


  return done;
}