import { NextRequest, NextResponse } from "next/server";

import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";

import Cart from "@/models/Cart";
import Product from "@/models/Product";
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





if(!userId){


return NextResponse.json(

{

success:false,

message:"User not found"

},

{

status:401

}

);


}








// =======================
// REQUEST DATA
// =======================


const body =
await req.json();




const {

shippingAddress,

paymentMethod="COD"

}=body;







if(

paymentMethod !== "COD"

&&

paymentMethod !== "ONLINE"

){


return NextResponse.json(

{

success:false,

message:"Invalid payment method"

},

{

status:400

}

);


}







if(!shippingAddress){


return NextResponse.json(

{

success:false,

message:"Shipping address required"

},

{

status:400

}

);


}









// =======================
// CART
// =======================



const cart =
await Cart.findOne({

userId

});





if(
!cart ||
cart.items.length===0
){


return NextResponse.json(

{

success:false,

message:"Cart is empty"

},

{

status:400

}

);


}


// =======================
// STOCK CHECK + ORDER ITEMS
// =======================


let subtotal = 0;


const orderItems:any[] = [];




for(const item of cart.items){



  const product =

  await Product.findById(

    item.productId

  );





  if(!product){


    return NextResponse.json(

    {

      success:false,

      message:
      `${item.name} product not found`

    },

    {

      status:404

    }

    );


  }







  if(product.stock < item.quantity){



    return NextResponse.json(

    {

      success:false,

      message:
      `${product.name} stock unavailable`

    },

    {

      status:400

    }

    );


  }







  subtotal +=

  item.price *

  item.quantity;







  orderItems.push({


    product:item.productId,


    name:item.name,


    image:item.image,


    price:item.price,


    quantity:item.quantity,


    size:item.size,


    color:item.color,


  });



}









// =======================
// UPDATE PRODUCT STOCK
// =======================



for(const item of cart.items){



await Product.findByIdAndUpdate(

item.productId,

{


$inc:{


stock:
-item.quantity,


sold:
item.quantity


}



}

);



}









// =======================
// CREATE ORDER
// =======================



const order =

await Order.create({



user:userId,





items:orderItems,





shippingAddress:{

fullName:
shippingAddress.fullName ||
shippingAddress.name,

mobile:
shippingAddress.mobile ||
shippingAddress.phone,

address:
shippingAddress.address,

area:
shippingAddress.area ||
"NA",

city:
shippingAddress.city,

state:
shippingAddress.state,

country:
shippingAddress.country || "India",

pincode:
shippingAddress.pincode,

landmark:
shippingAddress.landmark || "",

},







paymentMethod,






paymentStatus:

paymentMethod === "ONLINE"

?

"Pending"

:

"Pending",







orderStatus:"Placed",






deliveryHistory:[



{


status:"Placed",


date:new Date(),


note:"Order placed successfully"



}



],







subtotal,



shippingCharge:0,



discount:0,



totalAmount:subtotal,



refundStatus:"None"



});









// =======================
// CLEAR CART
// =======================



cart.items = [];



await cart.save();









return NextResponse.json(

{


success:true,


message:
"Order placed successfully",



orderId:
order._id



},


{


status:201


}


);







}catch(error:any){



console.log(

"PLACE ORDER ERROR:",

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
