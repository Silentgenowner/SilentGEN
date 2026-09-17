"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";



type Order = {

  _id:string;

  items:any[];

  shippingAddress:any;

  paymentMethod:string;

  paymentStatus:string;

  orderStatus:string;

  totalAmount:number;

  deliveryHistory:any[];

};





export default function OrderDetailPage(){


const params =
useParams();



const id =
params.id as string;





const [order,setOrder] =
useState<Order | null>(null);



const [loading,setLoading] =
useState(true);






async function loadOrder(){


try{


const res =
await fetch(

`/api/order/${id}`,

{

cache:"no-store"

}

);



const data =
await res.json();




if(data.success){


setOrder(data.order);


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


if(id){

loadOrder();

}


},[id]);









if(loading){


return(

<div className="
min-h-screen
flex
items-center
justify-center
">

Loading...


</div>

);


}







if(!order){


return(

<div className="
min-h-screen
flex
items-center
justify-center
">

Order not found


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
mb-8
">

Order Details

</h1>

<div className="
bg-gray-100
rounded-xl
p-4
mb-6
">

<p>
<b>Order ID:</b> {order._id}
</p>


<p>
<b>Status:</b> {order.orderStatus}
</p>

</div>





{/* DELIVERY TRACKING */}


<div className="
bg-white
shadow
rounded-xl
p-6
mb-8
">


<h2 className="
text-2xl
font-bold
mb-5
">

Delivery Tracking

</h2>





<div className="space-y-5">


{

order.deliveryHistory?.map(

(item,index)=>(


<div

key={index}

className="
flex
gap-4
items-start
"


>


<div className="
w-5
h-5
rounded-full
bg-black
mt-1
">

</div>





<div>


<h3 className="
font-bold
">

{item.status}

</h3>


<p className="text-gray-500">

{

new Date(
item.date
).toLocaleDateString()

}

</p>




{
item.note &&

<p>

{item.note}

</p>

}



</div>




</div>



)


)



}



</div>


</div>









{/* PRODUCTS */}



<div className="
bg-white
shadow
rounded-xl
p-6
mb-8
">


<h2 className="
text-2xl
font-bold
mb-5
">

Products

</h2>





{

order.items.map(

(item,index)=>(


<div

key={index}

className="
flex
gap-5
items-center
border-b
pb-4
mb-4
"

>


<Image

src={
item.image ||
"/images/no-image.png"
}

alt={item.name}

width={90}

height={90}

className="
rounded-lg
object-cover
"
loading="eager"
/>




<div>


<h3 className="
font-semibold
">

{item.name}

</h3>


<p>

Quantity:
{item.quantity}

</p>



<p className="
font-bold
">

₹{item.price * item.quantity}

</p>


</div>




</div>


)


)



}



</div>









{/* ADDRESS */}



<div className="
bg-white
shadow
rounded-xl
p-6
mb-8
">


<h2 className="
text-2xl
font-bold
mb-4
">

Delivery Address

</h2>





<p>
<b>Name:</b>
{" "}
{order.shippingAddress.fullName}
</p>



<p>
<b>Mobile:</b>
{" "}
{order.shippingAddress.mobile}
</p>



<p>
<b>Address:</b>
{" "}
{order.shippingAddress.address}
</p>



<p>
<b>Area:</b>
{" "}
{order.shippingAddress.area}
</p>



<p>
<b>City:</b>
{" "}
{order.shippingAddress.city}
</p>



<p>
<b>State:</b>
{" "}
{order.shippingAddress.state}
</p>



<p>
<b>Country:</b>
{" "}
{order.shippingAddress.country}
</p>



<p>
<b>Pincode:</b>
{" "}
{order.shippingAddress.pincode}
</p>




</div>









{/* PAYMENT */}



<div className="
bg-white
shadow
rounded-xl
p-6
">


<h2 className="
text-2xl
font-bold
">

Payment

</h2>



<p className="mt-3">

Method:
{" "}
{order.paymentMethod}

</p>



<p>

Status:
{" "}
{order.paymentStatus}

</p>




<h3 className="
text-2xl
font-bold
mt-4
">

Total:
₹{order.totalAmount}

</h3>









<div className="
flex
gap-4
mt-6
">





{

order.orderStatus === "Delivered"

&&

<>


<Link

href={`/account/orders/${order._id}/return`}

className="
bg-red-600
text-white
px-5
py-3
rounded-lg
"

>

Return Product

</Link>






<button

className="
bg-gray-800
text-white
px-5
py-3
rounded-lg
"

>

Exchange Product

</button>


</>


}





</div>







</div>






</main>


);


}
