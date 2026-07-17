import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import Address from "@/models/Address";


const JWT_SECRET = process.env.JWT_SECRET!;



// GET ALL ADDRESS

export async function GET() {

  try {


    const cookieStore =
      await cookies();


    const token =
      cookieStore.get("token")?.value;



    if(!token){

      return NextResponse.json(
        {
          success:false,
          message:"Unauthorized"
        },
        {
          status:401
        }
      );

    }



    const decoded:any =
      jwt.verify(
        token,
        JWT_SECRET
      );



    await connectDB();



    const addresses =
      await Address.find({

        userId: decoded.id

      });



    return NextResponse.json({

      success:true,

      addresses

    });



  }
  catch(error){


    console.error(
      "GET ADDRESS ERROR",
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





// ADD ADDRESS

export async function POST(
  request:Request
){

  try{


    const body =
      await request.json();



    const cookieStore =
      await cookies();



    const token =
      cookieStore.get("token")?.value;



    if(!token){


      return NextResponse.json(
        {
          success:false,
          message:"Unauthorized"
        },
        {
          status:401
        }
      );


    }



    const decoded:any =
      jwt.verify(
        token,
        JWT_SECRET
      );



    await connectDB();



    const address =
      await Address.create({

        userId:
        decoded.id,


        fullName:
        body.fullName,


        mobile:
        body.mobile,


        pincode:
        body.pincode,


        state:
        body.state,


        city:
        body.city,


        area:
        body.area,


        house:
        body.house,


        landmark:
        body.landmark || ""

      });



    return NextResponse.json({

      success:true,

      message:"Address Added",

      address

    });



  }
  catch(error){


    console.error(
      "ADD ADDRESS ERROR",
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
