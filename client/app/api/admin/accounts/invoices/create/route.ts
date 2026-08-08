import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";

import { verifyAdminToken } from "@/lib/adminAuth";

import Invoice from "@/models/Invoice";

import Transaction from "@/models/Transaction";

import Product from "@/models/Product";

import mongoose from "mongoose";





function generateInvoiceNumber(){

  const year =
  new Date().getFullYear();

  const random =
  Math.floor(
    1000 +
    Math.random()*9000
  );


  return `INV-${year}-${random}`;

}








export async function POST(
request:NextRequest
){


try{


// ======================
// Admin Authentication
// ======================


const token =
request.cookies.get(
"adminToken"
)?.value;



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



const admin =
await verifyAdminToken(token);






// ======================
// Database
// ======================


await connectDB();






const body =
await request.json();



const {

customerName,

customerPhone,

items,

}=body;







if(
!customerName ||
!items ||
items.length===0

){


return NextResponse.json(
{

success:false,

message:
"Invalid invoice data"

},
{
status:400
}

);


}







// ======================
// Calculate Invoice
// ======================


let subtotal = 0;

let discountTotal = 0;

let taxableAmount = 0;

let cgstTotal = 0;

let sgstTotal = 0;

let grandTotal = 0;






const invoiceItems:any[]=[];






for(
const item of items
){



const product =
await Product.findById(
item.productId
);





if(!product){


return NextResponse.json(
{

success:false,

message:
"Product not found"

},
{
status:404
}

);


}







if(
product.stock <
item.quantity

){


return NextResponse.json(
{

success:false,

message:
`${product.name} stock not available`

},
{
status:400
}

);


}







const amount =
item.quantity *
item.price;





const discount =
amount *
(
item.discount / 100
);





const taxable =
amount -
discount;





const gst =
taxable *
(
item.gstRate /100
);





const cgst =
gst/2;


const sgst =
gst/2;





subtotal += amount;


discountTotal += discount;


taxableAmount += taxable;


cgstTotal += cgst;


sgstTotal += sgst;


grandTotal +=
taxable+
gst;







invoiceItems.push({

productId:
product._id,

name:
product.name,

quantity:
item.quantity,

price:
item.price,

discount:
item.discount,

gstRate:
item.gstRate,

cgst,

sgst,

igst:0,

taxableAmount:taxable,

total:
taxable+gst,

});








// Stock update


product.stock -=
item.quantity;


product.sold +=
item.quantity;


await product.save();




}









// ======================
// Create Invoice
// ======================


const invoice =
await Invoice.create({

invoiceNumber:
generateInvoiceNumber(),


customerName,


customerPhone,


customerId:
new mongoose.Types.ObjectId(),


items:
invoiceItems,


subtotal,


discountTotal,


taxableAmount,


cgstTotal,


sgstTotal,


igstTotal:0,


grandTotal,


paidAmount:0,


dueAmount:
grandTotal,


paymentStatus:
"unpaid",


createdBy:
admin.adminId,

});








// ======================
// Transaction Entry
// ======================


await Transaction.create({

transactionNumber:
`TXN-${Date.now()}`,


transactionType:
"sale",


date:
new Date(),



ledgerId:
new mongoose.Types.ObjectId(),



amount:
grandTotal,



taxAmount:
cgstTotal+
sgstTotal,



cgst:
cgstTotal,



sgst:
sgstTotal,



igst:0,


totalAmount:
grandTotal,


paymentMode:
"credit",



referenceId:
invoice._id.toString(),


description:
"Sales Invoice Created",



createdBy:
admin.adminId,

});









return NextResponse.json(
{

success:true,

message:
"Invoice created successfully",


invoice,

}

);



}

catch(error){


console.error(
"CREATE_INVOICE_ERROR",
error
);



return NextResponse.json(
{

success:false,

message:
"Unable to create invoice"

},
{
status:500
}

);


}



}
