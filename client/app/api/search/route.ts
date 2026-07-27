import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";



export async function GET(
  req: NextRequest
) {

  try {


    await connectDB();



    const { searchParams } =
      new URL(req.url);



    const query =
      searchParams.get("q");



    if (!query) {


      return NextResponse.json(
        {
          success:false,
          message:"Search query required"
        },
        {
          status:400
        }
      );


    }



    const searchText =
      query.trim();



    const searchRegex = {
      $regex: searchText,
      $options:"i"
    };





    const products =
      await Product.find({

        $or:[

          {
            name: searchRegex
          },


          {
            category: searchRegex
          },


          {
            description: searchRegex
          },


          {
            brand: searchRegex
          },


          {
            fabric: searchRegex
          },


          {
            tags: searchRegex
          },


          {
            sku: searchRegex
          }

        ]

      })

      .limit(50)

      .lean();







    return NextResponse.json(

      {

        success:true,

        products

      },

      {

        status:200

      }

    );





  }
  catch(error:any){


    console.log(
      "SEARCH API ERROR:",
      error
    );



    return NextResponse.json(

      {

        success:false,

        message:
        error.message ||
        "Something went wrong"

      },

      {

        status:500

      }

    );


  }


}
