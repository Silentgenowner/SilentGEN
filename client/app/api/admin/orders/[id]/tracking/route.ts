import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";


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
          message:"Invalid token",
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

      courierPartner,

      trackingNumber

    } = body;









    if(
      !courierPartner ||
      !trackingNumber
    ){


      return NextResponse.json(
        {
          success:false,
          message:
          "Courier and tracking number required",
        },
        {
          status:400,
        }
      );


    }








    // =========================
    // UPDATE ORDER
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








    order.courierPartner =
      courierPartner;



    order.trackingNumber =
      trackingNumber;






    await order.save();








    return NextResponse.json(

      {

        success:true,

        message:
        "Tracking details saved",

        order,

      },

      {
        status:200,
      }

    );






  }
  catch(error:any){


    console.log(
      "TRACKING ERROR:",
      error
    );



    return NextResponse.json(
      {
        success:false,
        message:
        error.message ||
        "Tracking update failed",
      },
      {
        status:500,
      }
    );


  }


}
