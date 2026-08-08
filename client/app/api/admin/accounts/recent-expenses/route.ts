import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";

import Transaction from "@/models/Transaction";


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
    // Database Connection
    // ==========================

    await connectDB();







    // ==========================
    // Recent Expense Transactions
    // ==========================


    const expenses =
      await Transaction.find({

        transactionType:"expense",

      })
      .sort({

        createdAt:-1,

      })
      .limit(10)
      .select(
        `
        transactionNumber
        amount
        totalAmount
        paymentMode
        description
        date
        `
      )
      .lean();







    return NextResponse.json(
      {

        success:true,

        expenses,

      },
      {
        status:200,
      }
    );




  }

  catch(error){


    console.error(
      "RECENT_EXPENSES_ERROR:",
      error
    );



    return NextResponse.json(
      {

        success:false,

        message:
        "Unable to load recent expenses",

      },
      {
        status:500,
      }
    );


  }

}
