import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Address from "@/models/Address";


export async function POST(
  request: Request
) {

  try {

    const {
      id
    } = await request.json();



    if(!id){

      return NextResponse.json(
        {
          success:false,
          message:"Address ID required"
        },
        {
          status:400
        }
      );

    }



    await connectDB();



    await Address.findByIdAndDelete(
      id
    );



    return NextResponse.json(
      {
        success:true,
        message:"Address Deleted"
      }
    );



  }
  catch(error){


    console.error(
      "DELETE ADDRESS ERROR:",
      error
    );



    return NextResponse.json(
      {
        success:false,
        message:"Server Error"
      },
      {
        status:500
      }
    );


  }

}
