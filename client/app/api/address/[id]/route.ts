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






// UPDATE ADDRESS

export async function PUT(
  req: NextRequest,
  context: {
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





    const body =
      await req.json();





    const address =
      await Address.findOneAndUpdate(

        {
          _id:
          id,

          userId

        },


        {

          name:body.name,

          phone:body.phone,

          address:body.address,

          city:body.city,

          state:body.state,

          pincode:body.pincode,

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
      "UPDATE ADDRESS ERROR",
      error
    );



    return NextResponse.json(

      {
        success:false,
        message:"Update failed"
      },

      {
        status:500
      }

    );


  }

}












// DELETE ADDRESS

export async function DELETE(
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







    const address =
      await Address.findOneAndDelete({

        _id:
        id,

        userId

      });







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

      message:"Address deleted"

    });





  }
  catch(error){


    console.log(
      "DELETE ADDRESS ERROR",
      error
    );



    return NextResponse.json(

      {
        success:false,
        message:"Delete failed"
      },

      {
        status:500
      }

    );


  }

}
