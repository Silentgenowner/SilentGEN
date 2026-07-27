import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Address from "@/models/Address";


const JWT_SECRET = process.env.JWT_SECRET!;




function getUserId(req: NextRequest){

  const token =
    req.cookies.get("token")?.value;


  if(!token){

    return null;

  }



  try{


    const decoded:any =
      jwt.verify(
        token,
        JWT_SECRET
      );


    return decoded.userId || decoded.id;


  }
  catch{

    return null;

  }

}







export async function PUT(
  req: NextRequest,
  context:{
    params: Promise<{
      id:string;
    }>
  }
){

  try{
    const { id } = await context.params;


    await connectDB();



    const userId =
      getUserId(req);



    if(!userId){

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







    // Remove old default

    await Address.updateMany(

      {
        userId
      },

      {
        isDefault:false
      }

    );








    // Set new default

    const address =
      await Address.findOneAndUpdate(

        {
          _id:
          id,

          userId

        },

        {

          isDefault:true

        },

        {
          new:true
        }

      );






    if(!address){


      return NextResponse.json(

        {
          success:false,
          message:"Address not found"
        },

        {
          status:404
        }

      );


    }






    return NextResponse.json({

      success:true,

      address

    });



  }
  catch(error){


    console.log(
      "DEFAULT ADDRESS ERROR",
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
