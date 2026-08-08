import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import { calculateCartTotals } from "@/lib/cartTotals";
import { createInvoiceFromOrder } from "@/lib/createInvoiceFromOrder";

import Cart from "@/models/Cart";
import Product from "@/models/Product";
import Order from "@/models/Order";


const JWT_SECRET =
  process.env.JWT_SECRET!;


/*
|--------------------------------------------------------------------------
| PLACE ORDER
|--------------------------------------------------------------------------
*/

export async function POST(
  req: NextRequest
) {

  const session =
    await mongoose.startSession();


  try {

    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();


    session.startTransaction();


    /*
    |--------------------------------------------------------------------------
    | AUTH CHECK
    |--------------------------------------------------------------------------
    */

    const token =
      req.cookies.get("token")?.value;


    if (!token) {

      throw new Error(
        "Please login first"
      );

    }


    let decoded: {
      id: string;
    };


    try {

      decoded =
        jwt.verify(
          token,
          JWT_SECRET
        ) as {
          id: string;
        };

    }
    catch {

      throw new Error(
        "Please login first"
      );

    }


    const userId =
      decoded.id;


    if (!userId) {

      throw new Error(
        "Invalid user"
      );

    }


    /*
    |--------------------------------------------------------------------------
    | REQUEST BODY
    |--------------------------------------------------------------------------
    */

    const body =
      await req.json();


    const {
      shippingAddress,
      paymentMethod,
      couponCode = "",
      couponDiscount = 0,
    } = body;


    /*
    |--------------------------------------------------------------------------
    | SHIPPING ADDRESS VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!shippingAddress) {

      throw new Error(
        "Shipping address required"
      );

    }


    /*
    |--------------------------------------------------------------------------
    | PAYMENT METHOD VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      paymentMethod !== "COD" &&
      paymentMethod !== "ONLINE"
    ) {

      throw new Error(
        "Invalid payment method"
      );

    }


    /*
    |--------------------------------------------------------------------------
    | GET CART
    |--------------------------------------------------------------------------
    */

    const cart =
      await Cart.findOne({
        userId,
      })
        .session(session);


    if (
      !cart ||
      !Array.isArray(cart.items) ||
      cart.items.length === 0
    ) {

      throw new Error(
        "Cart is empty"
      );

    }


    /*
    |--------------------------------------------------------------------------
    | ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    let subtotal = 0;


    const orderItems: any[] = [];


    /*
    |--------------------------------------------------------------------------
    | PRODUCT VALIDATION
    |--------------------------------------------------------------------------
    */

    for (
      const item of cart.items
    ) {

      const product =
        await Product.findById(
          item.productId
        )
          .session(session);


      /*
      |----------------------------------------------------------------------
      | PRODUCT NOT FOUND
      |----------------------------------------------------------------------
      */

      if (!product) {

        throw new Error(
          `${item.name || "Product"} not found`
        );

      }


      /*
      |----------------------------------------------------------------------
      | PRODUCT STATUS
      |----------------------------------------------------------------------
      */

      if (
        product.status !== "Active" ||
        product.isDeleted === true
      ) {

        throw new Error(
          `${product.name} is currently unavailable`
        );

      }


      /*
      |----------------------------------------------------------------------
      | QUANTITY VALIDATION
      |----------------------------------------------------------------------
      */

      const quantity =
        Number(item.quantity);


      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {

        throw new Error(
          `Invalid quantity for ${product.name}`
        );

      }


      /*
      |----------------------------------------------------------------------
      | STOCK VALIDATION
      |----------------------------------------------------------------------
      */

      if (
        product.stock < quantity
      ) {

        throw new Error(
          `Only ${product.stock} quantity available for ${product.name}`
        );

      }


      /*
      |----------------------------------------------------------------------
      | PRICE
      |----------------------------------------------------------------------
      */

      const price =
        Number(product.price) || 0;


      if (price < 0) {

        throw new Error(
          `Invalid price for ${product.name}`
        );

      }


      /*
      |----------------------------------------------------------------------
      | ITEM TOTAL
      |----------------------------------------------------------------------
      */

      const itemTotal =
        price * quantity;


      subtotal +=
        itemTotal;


      /*
      |----------------------------------------------------------------------
      | ORDER ITEM
      |----------------------------------------------------------------------
      */

      orderItems.push({

        product:
          product._id,

        name:
          product.name,

        image:
          product.thumbnail || "",

        price,

        quantity,

        size:
          item.size || "",

        color:
          item.color || "",

      });

    }


    /*
    |--------------------------------------------------------------------------
    | CART TOTALS
    |--------------------------------------------------------------------------
    */

    const totals =
      calculateCartTotals(
        orderItems
      );


    const shippingCharge =
      Number(totals.shipping) || 0;


    /*
    |--------------------------------------------------------------------------
    | COUPON DISCOUNT
    |--------------------------------------------------------------------------
    */

    const discount =
      Math.max(
        Number(couponDiscount) || 0,
        0
      );


    /*
    |--------------------------------------------------------------------------
    | FINAL TOTAL
    |--------------------------------------------------------------------------
    */

    const totalAmount =
      Math.max(
        Number(totals.subtotal) +
        shippingCharge -
        discount,
        0
      );


    /*
    |--------------------------------------------------------------------------
    | ORDER NUMBER
    |--------------------------------------------------------------------------
    */

    const orderNumber =
      "SG" +
      Date.now();


    /*
    |--------------------------------------------------------------------------
    | CREATE ORDER
    |--------------------------------------------------------------------------
    */

    const createdOrders =
      await Order.create(
        [
          {

            /*
            |--------------------------------------------------------------
            | USER
            |--------------------------------------------------------------
            */

            user:
              userId,


            /*
            |--------------------------------------------------------------
            | ITEMS
            |--------------------------------------------------------------
            */

            items:
              orderItems,


            /*
            |--------------------------------------------------------------
            | SHIPPING
            |--------------------------------------------------------------
            */

            shippingAddress,


            /*
            |--------------------------------------------------------------
            | PAYMENT
            |--------------------------------------------------------------
            */

            paymentMethod,

            paymentStatus:
              "Pending",


            /*
            |--------------------------------------------------------------
            | ORDER STATUS
            |--------------------------------------------------------------
            */

            orderStatus:
              "Placed",


            /*
            |--------------------------------------------------------------
            | DELIVERY HISTORY
            |--------------------------------------------------------------
            */

            deliveryHistory: [

              {

                status:
                  "Placed",

                date:
                  new Date(),

                note:
                  "Order placed successfully",

              },

            ],


            /*
            |--------------------------------------------------------------
            | AMOUNTS
            |--------------------------------------------------------------
            */

            subtotal:

              Number(totals.subtotal) ||
              subtotal,

            shippingCharge,

            discount,

            totalAmount,


            /*
            |--------------------------------------------------------------
            | REFUND
            |--------------------------------------------------------------
            */

            refundStatus:
              "None",

          },
        ],
        {
          session,
        }
      );


    const order =
      createdOrders[0];


    if (!order) {

      throw new Error(
        "Order creation failed"
      );

    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE PRODUCT STOCK
    |--------------------------------------------------------------------------
    */

    for (
      const item of orderItems
    ) {

      const updated =
        await Product.updateOne(

          {
            _id:
              item.product,

            stock:
              {
                $gte:
                  item.quantity,
              },

          },

          {

            $inc:
              {

                stock:
                  -item.quantity,

                sold:
                  item.quantity,

              },

          },

          {
            session,
          }

        );


      /*
      |--------------------------------------------------------------------
      | STOCK UPDATE FAILED
      |--------------------------------------------------------------------
      */

      if (
        updated.modifiedCount !== 1
      ) {

        throw new Error(
          `${item.name} stock update failed`
        );

      }

    }


    /*
    |--------------------------------------------------------------------------
    | CREATE INVOICE AUTOMATICALLY
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Invoice is created immediately after Order + Stock update.
    |
    */

    const invoice =
      await createInvoiceFromOrder(
        order._id,
        session
      );


    if (!invoice) {

      throw new Error(
        "Invoice creation failed"
      );

    }


    /*
    |--------------------------------------------------------------------------
    | CLEAR CART
    |--------------------------------------------------------------------------
    */

    cart.items = [];


    await cart.save({
      session,
    });


    /*
    |--------------------------------------------------------------------------
    | COMMIT TRANSACTION
    |--------------------------------------------------------------------------
    */

    await session.commitTransaction();


    /*
    |--------------------------------------------------------------------------
    | SUCCESS RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(

      {

        success:
          true,

        message:
          "Order placed successfully",

        orderId:
          order._id,

        invoiceId:
          invoice._id,

        invoiceNumber:
          invoice.invoiceNumber,

        orderStatus:
          order.orderStatus,

        paymentStatus:
          order.paymentStatus,

        totalAmount:
          order.totalAmount,

      },

      {
        status:
          201,
      }

    );

  }


  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  catch (error: any) {


    /*
    |----------------------------------------------------------------------
    | ROLLBACK
    |----------------------------------------------------------------------
    */

    if (
      session.inTransaction()
    ) {

      await session.abortTransaction();

    }


    console.error(
      "PLACE ORDER ERROR:",
      error
    );


    /*
    |--------------------------------------------------------------------------
    | ERROR MESSAGE
    |--------------------------------------------------------------------------
    */

    const message =
      error?.message ||
      "Order failed";


    /*
    |--------------------------------------------------------------------------
    | RESPONSE STATUS
    |--------------------------------------------------------------------------
    */

    const status =
      message ===
      "Please login first"
        ? 401
        : 500;


    return NextResponse.json(

      {

        success:
          false,

        message,

      },

      {
        status,
      }

    );

  }


  /*
  |--------------------------------------------------------------------------
  | END SESSION
  |--------------------------------------------------------------------------
  */

  finally {

    await session.endSession();

  }

}