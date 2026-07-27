import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";


const JWT_SECRET = process.env.JWT_SECRET!;



export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      id:string;
    }>
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






    // =========================
    // PARAM
    // =========================


    const {
      id
    } =
    await context.params;





    const body =
      await req.json();




    const reason =
      body.reason || "Customer cancelled";







    // =========================
    // FIND ORDER
    // =========================


    const order =
      await Order.findOne({

        _id:id,

        user:userId,

      });





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







    // =========================
    // STATUS CHECK
    // =========================


    if(
      [
        "Shipped",
        "Out For Delivery",
        "Delivered",
        "Cancelled"
      ]
      .includes(
        order.orderStatus
      )
    ){


      return NextResponse.json(
        {
          success:false,

          message:
          "Order cannot be cancelled now",
        },
        {
          status:400,
        }
      );


    }







    // =========================
    // CANCEL ORDER
    // =========================



    order.orderStatus =
      "Cancelled";



    order.cancelReason =
      reason;



    await order.save();








    return NextResponse.json(

      {

        success:true,

        message:
        "Order cancelled successfully",

        order,

      },

      {
        status:200,
      }

    );





  }
  catch(error:any){


    console.log(
      "CANCEL ORDER ERROR:",
      error
    );



    return NextResponse.json(

      {
        success:false,

        message:
        error.message ||
        "Cancel order failed",
      },

      {
        status:500,
      }

    );


  }


}
