import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import User from "@/models/User";


const JWT_SECRET = process.env.JWT_SECRET!;


export async function POST(req: NextRequest) {

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



    const user =
      await User.findById(decoded.id);



    if(!user){

      return NextResponse.json(
        {
          success:false,
          message:"User not found"
        },
        {
          status:404
        }
      );

    }



    const body =
      await req.json();



    const {
      productId,
      quantity = 1,
      size = "",
      color = ""
    } = body;



    if(!productId){

      return NextResponse.json(
        {
          success:false,
          message:"Product ID required"
        },
        {
          status:400
        }
      );

    }



    const product =
      await Product.findById(productId);



    if(!product){

      return NextResponse.json(
        {
          success:false,
          message:"Product not found"
        },
        {
          status:404
        }
      );

    }



    let cart =
      await Cart.findOne({
        userId:user._id
      });



    if(!cart){

      cart =
        await Cart.create({

          userId:user._id,

          items:[
            {
              productId:product._id,
              name:product.name,
              image: product.thumbnail || 
              product.images?.[0] ||
               "",
              price:product.price,
              quantity,
              size,
              color
            }
          ]

        });


      return NextResponse.json(
        {
          success:true,
          message:"Product added to cart"
        }
      );

    }





    const existingItem =
      cart.items.find(
        (item:any)=>
          item.productId.toString() === productId &&
          (item.size || "") === size &&
          (item.color || "") === color
      );

    if(existingItem){
      existingItem.quantity += quantity;
    }
    else{
      cart.items.push({
        productId:product._id,
        name:product.name,
        image: product.thumbnail || product.images?.[0] || "",
        price:product.price,
        quantity,
        size,
        color
      } as any);
    }



    await cart.save();




    return NextResponse.json(
      {
        success:true,
        message:"Product added to cart"
      }
    );



  }
  catch(error:any){


    console.log(
      "ADD CART ERROR:",
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
