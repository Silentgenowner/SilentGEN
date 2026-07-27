import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Cart from "@/models/Cart";

const JWT_SECRET = process.env.JWT_SECRET!;


export async function PATCH(req: NextRequest) {

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
      color="",
      action
    } = await req.json();



    if(!productId || !action){

      return NextResponse.json(
        {
          success:false,
          message:"productId and action are required"
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



    const item =
      cart.items.find(
        (item:any)=>
          item.productId.toString() === productId &&
          (item.size || "") === size &&
          (item.color || "") === color
      );

    if(!item){
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

    if(action === "increase"){
      item.quantity += 1;
    }
    else if(action === "decrease"){
      if(item.quantity > 1){
        item.quantity -= 1;
      }
      else{
        cart.items =
          cart.items.filter(
            (cartItem:any)=>
              !(
                cartItem.productId.toString() === productId &&
                (cartItem.size || "") === size &&
                (cartItem.color || "") === color
              )
          );
      }
    }


    else{

      return NextResponse.json(
        {
          success:false,
          message:"Invalid action"
        },
        {
          status:400
        }
      );

    }



    await cart.save();



    return NextResponse.json(
      {
        success:true,
        message:"Cart updated successfully",
        cart
      }
    );



  }
  catch(error:any){

    console.error(
      "UPDATE CART ERROR:",
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