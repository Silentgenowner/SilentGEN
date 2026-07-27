import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Cart from "@/models/Cart";

const JWT_SECRET = process.env.JWT_SECRET!;


export async function GET(req: NextRequest) {

  try {

    await connectDB();


    const token =
      req.cookies.get("token")?.value;


    if (!token) {

      return NextResponse.json(
        {
          success:false,
          message:"Please login first"
        },
        {
          status:401
        }
      );

    }


    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      ) as {
        id:string;
      };



    const cart =
  await Cart.findOne({
    userId: decoded.id,
  }).populate("items.productId");

    return NextResponse.json(
      {
        success:true,

        items: cart?.items || []

      }
    );


  }
  catch(error:any){

    console.log(
      "GET CART ERROR:",
      error
    );


    return NextResponse.json(
      {
        success:false,
        message:error.message
      },
      {
        status:500
      }
    );

  }

}
