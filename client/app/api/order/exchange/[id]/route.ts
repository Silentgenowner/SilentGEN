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
      body.reason ||
      "Customer requested exchange";







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
      order.orderStatus !== "Delivered"
    ){


      return NextResponse.json(
        {
          success:false,

          message:
          "Only delivered orders can be exchanged",
        },
        {
          status:400,
        }
      );


    }









    // =========================
    // EXCHANGE REQUEST
    // =========================


    order.orderStatus =
      "Exchange Requested";



    order.exchangeReason =
      reason;



    await order.save();








    return NextResponse.json(

      {

        success:true,

        message:
        "Exchange request submitted",

        order,

      },

      {
        status:200,
      }

    );







  }
  catch(error:any){


    console.log(
      "EXCHANGE REQUEST ERROR:",
      error
    );



    return NextResponse.json(

      {
        success:false,

        message:
        error.message ||
        "Exchange request failed",
      },

      {
        status:500,
      }

    );


  }


}
