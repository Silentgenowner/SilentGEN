import { NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";


export async function GET() {

  try {

    await connectDB();


    const products = await Product.find({
      status: "Active",
    })
      .sort({
        createdAt: -1,
      })
      .lean();



    return NextResponse.json({

      success: true,

      products,

    });


  } catch (error) {


    console.error(
      "PRODUCT LIST ERROR:",
      error
    );


    return NextResponse.json(

      {
        success:false,
        message:"Server Error",
      },

      {
        status:500,
      }

    );

  }

}
