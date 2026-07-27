import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";


const JWT_SECRET = process.env.JWT_SECRET!;


export async function GET(
  req: NextRequest
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


    }catch{


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



    if(!userId){

      return NextResponse.json(
        {
          success:false,
          message:"User not found",
        },
        {
          status:401,
        }
      );

    }





    // =========================
    // GET ORDERS
    // =========================


    const orders =
      await Order.find({
        user:userId,
      })
      .sort({
        createdAt:-1,
      })
      .select(
        `
        _id
        items
        totalAmount
        paymentMethod
        paymentStatus
        orderStatus
        shippingAddress
        createdAt
        trackingNumber
        courierPartner
        `
      );





    return NextResponse.json(
      {
        success:true,

        count:
        orders.length,

        orders,

      },
      {
        status:200,
      }
    );



  }catch(error:any){


    console.log(
      "ORDER LIST ERROR:",
      error
    );


    return NextResponse.json(
      {
        success:false,

        message:
        error.message ||
        "Failed to get orders",
      },
      {
        status:500,
      }
    );


  }

}
