"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";


type Order = {

_id:string;

orderStatus:string;

paymentStatus:string;

paymentMethod:string;

totalAmount:number;

courierPartner?:string;

trackingNumber?:string;


items:{
name:string;
price:number;
quantity:number;
}[];


shippingAddress:{
fullName:string;
mobile:string;
address:string;
area:string;
city:string;
state:string;
pincode:string;
};


};





const statuses = [

"Confirmed",
"Packed",
"Shipped",
"Out For Delivery",
"Delivered",
"Cancelled"

];







export default function AdminOrderDetails(){



const params =
useParams();



const id =
params.id as string;





const [order,setOrder] =
useState<Order|null>(null);



const [loading,setLoading] =
useState(true);



const [updating,setUpdating] =
useState(false);




const [courier,setCourier] =
useState("");



const [tracking,setTracking] =
useState("");







useEffect(()=>{

fetchOrder();

},[]);







async function fetchOrder(){


try{


const res =
await fetch(
`/api/order/details/${id}`,
{
credentials:"include",
}
);


const data =
await res.json();



if(data.success){

setOrder(data.order);

setCourier(
data.order.courierPartner || ""
);

setTracking(
data.order.trackingNumber || ""
);

}



}
finally{


setLoading(false);


}


}








async function updateStatus(
status:string
){


try{


setUpdating(true);



await fetch(

`/api/admin/orders/${id}/status`,

{

method:"POST",

headers:{
"Content-Type":"application/json",
},

credentials:"include",

body:JSON.stringify({

status,

message:
`Order ${status}`

})

}

);



fetchOrder();



}
finally{


setUpdating(false);


}


}








async function saveTracking(){



try{


setUpdating(true);



const res =
await fetch(

`/api/admin/orders/${id}/tracking`,

{

method:"POST",

headers:{
"Content-Type":"application/json",
},

credentials:"include",

body:JSON.stringify({

courierPartner:courier,

trackingNumber:tracking,

})

}

);




const data =
await res.json();




if(data.success){


alert(
"Tracking Saved"
);


fetchOrder();


}
else{


alert(
data.message
);


}



}
finally{


setUpdating(false);


}



}









if(loading){


return(

<div className="p-10">

Loading...

</div>

);


}







if(!order){

return(

<div className="p-10">

Order Not Found

</div>

);

}








return(


<div className="max-w-6xl mx-auto p-6">



<Link
href="/admin/orders"
className="underline"
>

← Back Orders

</Link>






<h1 className="text-3xl font-bold my-6">

Order Management

</h1>









<div className="border rounded-xl p-5">


<h2 className="text-xl font-bold">

Status:

{" "}

{order.orderStatus}

</h2>





<div className="flex flex-wrap gap-3 mt-5">


{
statuses.map(
(status)=>(


<button

key={status}

disabled={updating}

onClick={()=>updateStatus(status)}

className="
bg-black
text-white
px-4
py-2
rounded
"

>

{status}

</button>


)

)

}


</div>


</div>










<div className="border rounded-xl p-5 mt-6">


<h2 className="text-xl font-bold mb-4">

Shipping Details

</h2>





<input

value={courier}

onChange={
(e)=>setCourier(e.target.value)
}

placeholder="Courier Partner"

className="
border
p-2
w-full
mb-3
rounded
"

/>






<input

value={tracking}

onChange={
(e)=>setTracking(e.target.value)
}

placeholder="Tracking Number"

className="
border
p-2
w-full
mb-3
rounded
"

/>







<button

onClick={saveTracking}

disabled={updating}

className="
bg-blue-600
text-white
px-5
py-2
rounded
"

>

Save Tracking

</button>




</div>









<div className="border rounded-xl p-5 mt-6">


<h2 className="text-xl font-bold mb-4">

Products

</h2>



{
order.items.map(
(item,index)=>(


<div
key={index}
className="border-b py-3"
>

<p className="font-semibold">

{item.name}

</p>


<p>

Qty:
{item.quantity}

</p>


<p>

₹{item.price}

</p>


</div>


)

)

}


</div>









</div>


);


}
