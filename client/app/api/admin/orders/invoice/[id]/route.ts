import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";


const JWT_SECRET = process.env.JWT_SECRET!;



export async function GET(
  req: NextRequest,
  context:{
    params:Promise<{
      id:string;
    }>;
  }
){


  try{


    await connectDB();





    const token =
      req.cookies.get("token")?.value;



    if(!token){

      return new Response(
        "Login required",
        {
          status:401,
        }
      );

    }






    let decoded:any;


    try{


      decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );


    }
    catch{


      return new Response(
        "Invalid token",
        {
          status:401,
        }
      );


    }





    const userId =
      decoded.id ||
      decoded.userId;







    const {
      id
    } =
    await context.params;







    const order =
      await Order.findOne({

        _id:id,

        user:userId,

      });








    if(!order){


      return new Response(
        "Order not found",
        {
          status:404,
        }
      );


    }









    const pdf =
    new PDFDocument();




    const chunks:Buffer[] = [];





    pdf.on(
      "data",
      (chunk)=>{

        chunks.push(chunk);

      }
    );






    const pdfPromise =
    new Promise<Buffer>(
      (resolve)=>{


        pdf.on(
          "end",
          ()=>{

            resolve(
              Buffer.concat(chunks)
            );

          }
        );


      }
    );








    // =========================
    // PDF CONTENT
    // =========================



    pdf.fontSize(22)

    .text(
      "SilentGEN Fashion",
      {
        align:"center"
      }
    );



    pdf.moveDown();




    pdf.fontSize(14)

    .text(
      `Invoice ID: ${order._id}`
    );



    pdf.text(
      `Order Date: ${order.createdAt.toDateString()}`
    );



    pdf.moveDown();





    pdf.text(
      "Customer Details"
    );



    pdf.text(
      order.shippingAddress.fullName
    );


    pdf.text(
      order.shippingAddress.mobile
    );


    pdf.text(
      `${order.shippingAddress.city}, ${order.shippingAddress.state}`
    );







    pdf.moveDown();





    pdf.text(
      "Products"
    );







    order.items.forEach(
      (item:any)=>{


        pdf.text(

          `${item.name} x ${item.quantity} = ₹${item.price}`

        );


      }
    );







    pdf.moveDown();





    pdf.fontSize(16)

    .text(

      `Total Amount: ₹${order.totalAmount}`

    );





    pdf.end();







    const buffer =
    await pdfPromise;








    return new Response(

  new Uint8Array(buffer),

  {

    headers:{

      "Content-Type":
      "application/pdf",


      "Content-Disposition":
      `attachment; filename=invoice-${order._id}.pdf`,

    }

  }

);







  }
  catch(error){


    console.log(
      "INVOICE ERROR",
      error
    );



    return new Response(
      "Invoice failed",
      {
        status:500,
      }
    );


  }


}
