import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";


const JWT_SECRET = process.env.JWT_SECRET!;



export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id:string;
    }>;
  }
) {


  try {


    await connectDB();




    // =========================
    // AUTH CHECK
    // =========================


    const token =
      req.cookies.get("token")?.value;



    if(!token){


      return NextResponse.json(
        {
          success:false,
          message:"Please login first",
        },
        {
          status:401,
        }
      );


    }





    let decoded:any;


    try{


      decoded =
        jwt.verify(
          token,
          JWT_SECRET
        );


    }
    catch{


      return NextResponse.json(
        {
          success:false,
          message:"Invalid token",
        },
        {
          status:401,
        }
      );


    }





    const userId =
      decoded.id ||
      decoded.userId;







    const {
      id
    } =
    await context.params;







    // =========================
    // FIND ORDER
    // =========================


    const order =
      await Order.findOne({

        _id:id,

        user:userId,

      })
      .select(
        `
        _id
        orderStatus
        refundStatus
        totalAmount
        returnReason
        `
      );






    if(!order){


      return NextResponse.json(
        {
          success:false,
          message:"Order not found",
        },
        {
          status:404,
        }
      );


    }







    return NextResponse.json(

      {

        success:true,

        refund:{

          orderId:
          order._id,

          orderStatus:
          order.orderStatus,


          refundStatus:
          order.refundStatus,


          amount:
          order.totalAmount,


          reason:
          order.returnReason,

        }

      },

      {
        status:200,
      }

    );





  }
  catch(error:any){


    console.log(
      "REFUND STATUS ERROR:",
      error
    );



    return NextResponse.json(

      {
        success:false,

        message:
        error.message ||
        "Refund status failed",

      },

      {
        status:500,
      }

    );


  }

}
