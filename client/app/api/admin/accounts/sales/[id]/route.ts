import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";

import Invoice from "@/models/Invoice";




export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id:string;
    }>
  }
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





    const {id} =
    await context.params;






    const invoice =
    await Invoice.findById(id)
    .populate(
      "customerId",
      "name email mobile"
    )
    .lean();







    if(!invoice){


      return NextResponse.json(
        {
          success:false,
          message:"Invoice not found",
        },
        {
          status:404,
        }
      );


    }








    return NextResponse.json(
      {
        success:true,

        invoice,

      }
    );





  }
  catch(error){



    console.log(
      "INVOICE_DETAIL_ERROR",
      error
    );




    return NextResponse.json(
      {
        success:false,
        message:
        "Unable to load invoice",
      },
      {
        status:500,
      }
    );


  }


}