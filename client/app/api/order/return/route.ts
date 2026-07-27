import { NextRequest, NextResponse } from "next/server";

import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";

import Order from "@/models/Order";



const JWT_SECRET =
process.env.JWT_SECRET!;






export async function POST(
req:NextRequest
){


try{


await connectDB();





// =======================
// AUTH CHECK
// =======================


const token =
req.cookies.get("token")?.value;



if(!token){


return NextResponse.json(

{

success:false,

message:"Please login first"

},

{

status:401

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


return NextResponse.json(

{

success:false,

message:"Invalid token"

},

{

status:401

}

);


}






const userId =
decoded.id ||
decoded.userId;







const body =
await req.json();



const {

orderId,

reason,

image=""

}=body;







if(!orderId || !reason){


return NextResponse.json(

{

success:false,

message:"Order and reason required"

},

{

status:400

}

);


}









// =======================
// FIND ORDER
// =======================



const order =

await Order.findOne({

_id:orderId,

user:userId

});







if(!order){


return NextResponse.json(

{

success:false,

message:"Order not found"

},

{

status:404

}

);


}








if(order.orderStatus !== "Delivered"){


return NextResponse.json(

{

success:false,

message:
"Only delivered orders can be returned"

},

{

status:400

}

);


}









// =======================
// CREATE RETURN REQUEST
// =======================



order.returnRequest = {


reason,


image,


status:"Pending",


requestedAt:new Date()


};





order.orderStatus =
"Return Requested";





order.deliveryHistory.push({


status:"Placed",


date:new Date(),


note:"Return request submitted"


});







await order.save();








return NextResponse.json(

{


success:true,


message:
"Return request submitted successfully"



},


{


status:200


}


);






}
catch(error:any){



console.log(

"RETURN ERROR:",

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
