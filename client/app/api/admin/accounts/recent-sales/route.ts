import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";

import Invoice from "@/models/Invoice";
import Order from "@/models/Order";


export async function GET(
  request: NextRequest
) {

  try {


    // ==========================
    // Admin Authentication
    // ==========================

    const token =
      request.cookies.get(
        "adminToken"
      )?.value;



    if (!token) {

      return NextResponse.json(
        {
          success:false,
          message:"Unauthorized",
        },
        {
          status:401,
        }
      );

    }



    await verifyAdminToken(token);



    // ==========================
    // Database
    // ==========================

    await connectDB();




    // ==========================
    // Recent Invoices
    // ==========================

    const invoices =
      await Invoice.find({})
      .sort({
        createdAt:-1,
      })
      .limit(10)
      .select(
        `
        invoiceNumber
        customerName
        grandTotal
        paymentStatus
        invoiceDate
        `
      )
      .lean();






    // ==========================
    // Recent Orders
    // ==========================

    const orders =
      await Order.find({})
      .sort({
        createdAt:-1,
      })
      .limit(10)
      .select(
        `
        totalAmount
        paymentStatus
        orderStatus
        createdAt
        `
      )
      .lean();






    return NextResponse.json(
      {

        success:true,


        invoices,


        orders,


      },
      {
        status:200,
      }
    );



  }

  catch(error){


    console.error(
      "RECENT_SALES_ERROR:",
      error
    );



    return NextResponse.json(
      {

        success:false,

        message:
        "Unable to load recent sales",

      },
      {
        status:500,
      }
    );


  }

}