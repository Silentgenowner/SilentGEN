import mongoose from "mongoose";

import Invoice from "@/models/Invoice";
import Order from "@/models/Order";


/*
|--------------------------------------------------------------------------
| Generate Next Invoice Number
|--------------------------------------------------------------------------
*/

async function generateInvoiceNumber(
  session?: mongoose.ClientSession
) {

  const year =
    new Date().getFullYear();

  const prefix =
    `INV-${year}-`;

  const lastInvoice =
    await Invoice.findOne({
      invoiceNumber: {
        $regex: `^${prefix}`,
      },
    })
      .sort({
        invoiceNumber: -1,
      })
      .select("invoiceNumber")
      .session(session || null)
      .lean();


  let nextNumber = 1;


  if (
    lastInvoice?.invoiceNumber
  ) {

    const lastNumber =
      Number(
        lastInvoice.invoiceNumber
          .replace(prefix, "")
      );


    if (
      Number.isFinite(lastNumber)
    ) {

      nextNumber =
        lastNumber + 1;

    }

  }


  return (
    `${prefix}` +
    String(nextNumber)
      .padStart(5, "0")
  );

}


/*
|--------------------------------------------------------------------------
| Create Invoice From Order
|--------------------------------------------------------------------------
*/

export async function createInvoiceFromOrder(
  orderId:
    | string
    | mongoose.Types.ObjectId,

  session?: mongoose.ClientSession
) {


  /*
  |--------------------------------------------------------------------------
  | Find Order
  |--------------------------------------------------------------------------
  */

  const orderQuery =
    Order.findById(orderId)
      .populate(
        "user",
        "name email mobile phone"
      );


  if (session) {
    orderQuery.session(session);
  }


  const order =
    await orderQuery.lean();


  if (!order) {

    throw new Error(
      "Order not found"
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Prevent Duplicate Invoice
  |--------------------------------------------------------------------------
  */

  const invoiceQuery =
    Invoice.findOne({
      orderId: order._id,
    });


  if (session) {
    invoiceQuery.session(session);
  }


  const existingInvoice =
    await invoiceQuery.lean();


  if (existingInvoice) {

    return existingInvoice;

  }


  /*
  |--------------------------------------------------------------------------
  | Customer Details
  |--------------------------------------------------------------------------
  */

  const user =
    order.user as any;


  const customerName =
    order.shippingAddress?.fullName ||
    user?.name ||
    "Customer";


  const customerPhone =
    order.shippingAddress?.mobile ||
    user?.mobile ||
    user?.phone ||
    "";


  const customerAddress = [

    order.shippingAddress?.address,

    order.shippingAddress?.area,

    order.shippingAddress?.city,

    order.shippingAddress?.state,

    order.shippingAddress?.country,

    order.shippingAddress?.pincode,

  ]
    .filter(Boolean)
    .join(", ");


  /*
  |--------------------------------------------------------------------------
  | Invoice Items
  |--------------------------------------------------------------------------
  */

  const invoiceItems =
    (order.items || []).map(
      (item: any) => {

        const quantity =
          Number(item.quantity) || 0;


        const price =
          Number(item.price) || 0;


        /*
        |--------------------------------------------------------------------------
        | Default GST
        |--------------------------------------------------------------------------
        */

        const gstRate = 18;


        const grossAmount =
          quantity * price;


        const taxableAmount =
          grossAmount;


        const gstAmount =
          taxableAmount *
          (gstRate / 100);


        const cgst =
          gstAmount / 2;


        const sgst =
          gstAmount / 2;


        const total =
          taxableAmount +
          gstAmount;


        return {

          productId:
            item.product,

          name:
            item.name,

          quantity,

          price,

          discount: 0,

          taxableAmount,

          gstRate,

          cgst,

          sgst,

          igst: 0,

          total,

        };

      }
    );


  /*
  |--------------------------------------------------------------------------
  | Totals
  |--------------------------------------------------------------------------
  */

  const subtotal =
    Number(order.subtotal) || 0;


  const discountTotal =
    Number(order.discount) || 0;


  const taxableAmount =
    Math.max(
      subtotal -
      discountTotal,
      0
    );


  /*
  |--------------------------------------------------------------------------
  | GST Totals
  |--------------------------------------------------------------------------
  */

  const cgstTotal =
    invoiceItems.reduce(
      (
        total: number,
        item: any
      ) => {

        return (
          total +
          (Number(item.cgst) || 0)
        );

      },
      0
    );


  const sgstTotal =
    invoiceItems.reduce(
      (
        total: number,
        item: any
      ) => {

        return (
          total +
          (Number(item.sgst) || 0)
        );

      },
      0
    );


  const igstTotal =
    invoiceItems.reduce(
      (
        total: number,
        item: any
      ) => {

        return (
          total +
          (Number(item.igst) || 0)
        );

      },
      0
    );


  /*
  |--------------------------------------------------------------------------
  | Grand Total
  |--------------------------------------------------------------------------
  */

  const grandTotal =
    Number(order.totalAmount) || 0;


  /*
  |--------------------------------------------------------------------------
  | Payment Status
  |--------------------------------------------------------------------------
  */

  const orderPaymentStatus =
    String(
      order.paymentStatus || ""
    ).toLowerCase();


  let paymentStatus:
    | "unpaid"
    | "partial"
    | "paid";


  if (
    orderPaymentStatus === "paid"
  ) {

    paymentStatus = "paid";

  }
  else {

    paymentStatus = "unpaid";

  }


  /*
  |--------------------------------------------------------------------------
  | Paid / Due
  |--------------------------------------------------------------------------
  */

  const paidAmount =
    paymentStatus === "paid"
      ? grandTotal
      : 0;


  const dueAmount =
    Math.max(
      grandTotal -
      paidAmount,
      0
    );


  /*
  |--------------------------------------------------------------------------
  | Invoice Number
  |--------------------------------------------------------------------------
  */

  const invoiceNumber =
    await generateInvoiceNumber(
      session
    );


  /*
  |--------------------------------------------------------------------------
  | Create Invoice
  |--------------------------------------------------------------------------
  */

  const invoiceData = {

    invoiceNumber,

    invoiceDate:
      order.createdAt ||
      new Date(),

    customerId:
      order.user,

    customerName,

    customerPhone,

    customerAddress,

    items:
      invoiceItems,

    subtotal,

    discountTotal,

    taxableAmount,

    cgstTotal,

    sgstTotal,

    igstTotal,

    grandTotal,

    paidAmount,

    dueAmount,

    paymentStatus,

    orderId:
      order._id,

  };


  let invoice;


  if (session) {

    const created =
      await Invoice.create(
        [invoiceData],
        {
          session,
        }
      );

    invoice =
      created[0];

  }
  else {

    invoice =
      await Invoice.create(
        invoiceData
      );

  }


  return invoice;

}
