"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";



type OrderItem = {

  name:string;  

  image:string;

  price:number;

  quantity:number;

};



type Order = {

  _id:string;

  items:OrderItem[];

  totalAmount:number;

  orderStatus:string;

  paymentMethod:string;

  createdAt:string;

};





export default function OrdersPage(){



const [orders,setOrders] =
useState<Order[]>([]);



const [loading,setLoading] =
useState(true);





async function loadOrders(){


try{


const res =
await fetch(

"/api/order/my-orders",

{

cache:"no-store"

}

);



const data =
await res.json();





if(data.success){

setOrders(
data.orders || []
);

}



}

catch(error){


console.log(error);


}

finally{


setLoading(false);


}



}






useEffect(()=>{


loadOrders();


},[]);









if(loading){


return(

<div className="
min-h-screen
flex
items-center
justify-center
">

Loading Orders...


</div>

);


}








if(orders.length===0){


return(

<div className="
min-h-screen
flex
flex-col
items-center
justify-center
">


<h1 className="
text-3xl
font-bold
">

No Orders Found


</h1>




<Link

href="/shop"

className="
mt-6
bg-black
text-white
px-6
py-3
rounded-lg
"

>

Continue Shopping


</Link>


</div>

);


}








return(


<main className="
max-w-6xl
mx-auto
px-6
py-10
">





<h1 className="
text-4xl
font-bold
mb-10
">

My Orders


</h1>







<div className="space-y-6">


{

orders.map((order)=>(
    


<div

key={order._id}

className="
bg-white
shadow
rounded-xl
p-6
"


>





<div className="
flex
justify-between
items-center
mb-5
">


<div>

<p className="font-semibold">

Order ID

</p>


<p className="text-sm text-gray-500">

Date:
{" "}
{new Date(order.createdAt).toLocaleDateString("en-GB")}

</p>


</div>





<div>

<span className="
px-4
py-2
rounded-full
bg-gray-100
font-semibold
">

{order.orderStatus}


</span>


</div>


</div>









<div className="space-y-4">


{

order.items.map((item,index)=>(


<div

key={index}

className="
flex
items-center
gap-4
border-b
pb-4
"


>


<Image

src={
item.image ||
"/images/no-image.png"
}

alt={item.name}

width={80}

height={80}

className="
rounded-lg
object-cover
"

/>




<div>

<h2 className="
font-semibold
">

{item.name}

</h2>


<p>

Qty: {item.quantity}

</p>


<p>

₹{item.price}

</p>


</div>



</div>


))


}



</div>








<div className="
mt-5
flex
justify-between
items-center
">


<h2 className="
text-xl
font-bold
">

Total:

₹{order.totalAmount}


</h2>





<Link

href={`/account/orders/${order._id}`}

className="
bg-black
text-white
px-5
py-3
rounded-lg
"

>

View Details


</Link>




</div>







</div>



))


}



</div>





</main>


);


}
