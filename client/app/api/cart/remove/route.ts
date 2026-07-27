import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Cart from "@/models/Cart";

const JWT_SECRET = process.env.JWT_SECRET!;


export async function DELETE(req: NextRequest) {

  try {

    await connectDB();


    const token =
      req.cookies.get("token")?.value;


    if(!token){

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



    const {
      productId,
      size="",
      color=""
    } = await req.json();



    if(!productId){

      return NextResponse.json(
        {
          success:false,
          message:"productId is required"
        },
        {
          status:400
        }
      );

    }



    const cart =
      await Cart.findOne({
        userId:decoded.id
      });



    if(!cart){

      return NextResponse.json(
        {
          success:false,
          message:"Cart not found"
        },
        {
          status:404
        }
      );

    }



    const oldLength =
      cart.items.length;



    cart.items =
      cart.items.filter(
        (item:any)=>
          !(
            item.productId.toString() === productId &&
            (item.size || "") === size &&
            (item.color || "") === color
          )
      );



    if(cart.items.length === oldLength){

      return NextResponse.json(
        {
          success:false,
          message:"Cart item not found"
        },
        {
          status:404
        }
      );

    }



    await cart.save();



    return NextResponse.json(
      {
        success:true,
        message:"Item removed from cart",
        cart
      }
    );



  }
  catch(error:any){

    console.error(
      "REMOVE CART ERROR:",
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
