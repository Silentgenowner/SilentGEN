import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";

import Order from "@/models/Order";
import OrderTimeline from "@/models/OrderTimeline";


const JWT_SECRET = process.env.JWT_SECRET!;



export async function POST(
  req: NextRequest,
  context:{
    params:Promise<{
      id:string;
    }>;
  }
){

  try{


    await connectDB();




    // =========================
    // ADMIN AUTH
    // =========================


    const token =
      req.cookies.get("adminToken")?.value;



    if(!token){

      return NextResponse.json(
        {
          success:false,
          message:"Admin login required",
        },
        {
          status:401,
        }
      );

    }





    try{


      jwt.verify(
        token,
        JWT_SECRET
      );


    }
    catch{


      return NextResponse.json(
        {
          success:false,
          message:"Invalid admin token",
        },
        {
          status:401,
        }
      );


    }







    const {
      id
    } =
    await context.params;





    const body =
      await req.json();



    const {
      status,
      message
    } = body;






    if(!status){


      return NextResponse.json(
        {
          success:false,
          message:"Status required",
        },
        {
          status:400,
        }
      );


    }







    // =========================
    // FIND ORDER
    // =========================


    const order =
      await Order.findById(id);






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
    // UPDATE ORDER
    // =========================


    order.orderStatus =
      status;



    if(status === "Delivered"){

      order.deliveredAt =
        new Date();

    }





    await order.save();









    // =========================
    // CREATE TIMELINE
    // =========================



    await OrderTimeline.create({

      order:order._id,

      status,

      message:
      message ||
      `Order status changed to ${status}`,

    });









    return NextResponse.json(

      {

        success:true,

        message:
        "Order status updated",

        order,

      },

      {
        status:200,
      }

    );







  }
  catch(error:any){


    console.log(
      "STATUS UPDATE ERROR",
      error
    );



    return NextResponse.json(
      {
        success:false,
        message:
        error.message ||
        "Status update failed",
      },
      {
        status:500,
      }
    );


  }


}
