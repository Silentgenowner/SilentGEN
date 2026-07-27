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
    // ADMIN AUTH CHECK
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
          message:"Invalid admin token",
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

      await Order.find()

      .populate(
        "user",
        "name email mobile"
      )

      .sort({

        createdAt:-1,

      });








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







  }
  catch(error:any){



    console.log(
      "ADMIN ORDERS ERROR:",
      error
    );



    return NextResponse.json(

      {

        success:false,

        message:
        error.message ||
        "Failed to fetch orders",

      },

      {
        status:500,
      }

    );


  }


}
