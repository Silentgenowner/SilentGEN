import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import mongoose from "mongoose";


export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {

  try {

    await connectDB();


    const { id } = await params;



    if (!mongoose.Types.ObjectId.isValid(id)) {

      return NextResponse.json(
        {
          success: false,
          message: "Invalid Product ID",
        },
        {
          status: 400,
        }
      );

    }



    const product =
      await Product.findById(id);



    if (!product) {

      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        {
          status: 404,
        }
      );

    }



    return NextResponse.json({

      success: true,

      product,

    });



  } catch (error) {


    console.error(
      "PRODUCT DETAILS ERROR:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message: "Server Error",
      },
      {
        status: 500,
      }
    );

  }

}
