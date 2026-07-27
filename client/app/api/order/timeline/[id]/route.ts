import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";

import Order from "@/models/Order";
import OrderTimeline from "@/models/OrderTimeline";


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
    // ORDER CHECK
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
    // TIMELINE FETCH
    // =========================



    const timeline =

      await OrderTimeline.find({

        order:id,

      })
      .sort({

        createdAt:-1,

      });









    return NextResponse.json(

      {

        success:true,

        timeline,

      },

      {
        status:200,
      }

    );







  }
  catch(error:any){


    console.log(
      "TIMELINE ERROR:",
      error
    );



    return NextResponse.json(

      {

        success:false,

        message:
        error.message ||
        "Timeline fetch failed",

      },

      {
        status:500,
      }

    );


  }


}
