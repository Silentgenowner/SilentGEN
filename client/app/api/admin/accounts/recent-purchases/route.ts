import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";

import Purchase from "@/models/Purchase";


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
    // Recent Purchase Entries
    // ==========================


    const purchases =
      await Purchase.find({})
      .sort({
        createdAt:-1,
      })
      .limit(10)
      .select(
        `
        purchaseNumber
        supplierName
        grandTotal
        paymentStatus
        purchaseDate
        `
      )
      .lean();







    return NextResponse.json(
      {

        success:true,

        purchases,

      },
      {
        status:200,
      }
    );




  }

  catch(error){


    console.error(
      "RECENT_PURCHASES_ERROR:",
      error
    );



    return NextResponse.json(
      {

        success:false,

        message:
        "Unable to load recent purchases",

      },
      {
        status:500,
      }
    );


  }

}