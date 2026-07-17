import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET!;


export async function POST(
  request: Request
) {

  try {

    const {
      name
    } = await request.json();


    if(!name){

      return NextResponse.json(
        {
          success:false,
          message:"Name required"
        },
        {
          status:400
        }
      );

    }



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



    const user =
      await User.findOneAndUpdate(

        {
          mobile: decoded.mobile
        },

        {
          name:name
        },

        {
          new:true
        }

      );



    return NextResponse.json(
      {
        success:true,
        message:"Profile Updated",
        user
      }
    );


  }
  catch(error){


    console.error(
      "UPDATE PROFILE ERROR:",
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
