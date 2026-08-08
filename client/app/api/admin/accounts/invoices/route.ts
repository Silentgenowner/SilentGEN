import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";

import Invoice from "@/models/Invoice";



export async function GET(
  request: NextRequest
) {


  try {


    const token =
    request.cookies.get(
      "adminToken"
    )?.value;



    if(!token){

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



    await connectDB();




    const invoices =
    await Invoice.find({})
    .sort({
      createdAt:-1,
    })
    .limit(100)
    .lean();





    return NextResponse.json(
      {

        success:true,

        invoices,

      }
    );



  }

  catch(error){


    console.error(
      "INVOICE_LIST_ERROR:",
      error
    );



    return NextResponse.json(
      {

        success:false,

        message:
        "Unable to load invoices",

      },
      {
        status:500,
      }
    );


  }


}