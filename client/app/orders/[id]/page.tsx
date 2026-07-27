"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";


type Order = {
  _id:string;

  items:{
    name:string;
    image:string;
    price:number;
    quantity:number;
    size?:string;
    color?:string;
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

  paymentMethod:string;

  paymentStatus:string;

  orderStatus:string;

  totalAmount:number;

  trackingNumber?:string;

  courierPartner?:string;

  cancelReason?:string;

  returnReason?:string;

  exchangeReason?:string;
};





export default function OrderDetailsPage(){


  const params = useParams();


  const id =
    params.id as string;



  const [order,setOrder] =
    useState<Order|null>(null);



  const [loading,setLoading] =
    useState(true);



  const [actionLoading,setActionLoading] =
    useState(false);



  const [reason,setReason] =
    useState("");







  useEffect(()=>{

    if(id){

      fetchOrder();

    }

  },[id]);






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

      }


    }
    catch(error){

      console.log(error);

    }
    finally{

      setLoading(false);

    }

  }







  async function orderAction(
    type:"cancel"|"return"|"exchange"
  ){



    if(
      type !== "cancel" &&
      !reason
    ){

      alert(
        "Please enter reason"
      );

      return;

    }





    const confirmAction =
      confirm(
        `Are you sure you want to ${type} this order?`
      );



    if(!confirmAction){

      return;

    }





    try{


      setActionLoading(true);



      const api =
      type==="cancel"
      ?
      "cancel"
      :
      type==="return"
      ?
      "return"
      :
      "exchange";





      const res =
      await fetch(
        `/api/order/${api}/${id}`,
        {

          method:"POST",

          headers:{
            "Content-Type":"application/json",
          },


          credentials:"include",


          body:JSON.stringify({

            reason:
            reason ||
            `Customer ${type}`,

          }),

        }
      );




      const data =
      await res.json();



      if(data.success){


        alert(
          `${type} request successful`
        );


        setReason("");

        fetchOrder();


      }
      else{


        alert(
          data.message
        );


      }




    }
    catch(error){


      console.log(error);


      alert(
        "Something went wrong"
      );


    }
    finally{


      setActionLoading(false);


    }


  }









  if(loading){


    return(

      <div className="p-10 text-center">

        Loading...

      </div>

    );


  }







  if(!order){


    return(

      <div className="p-10 text-center">

        Order not found

      </div>

    );

  }







  return(

<div className="max-w-6xl mx-auto px-4 py-10">



<Link
href="/orders"
className="underline"
>

Back To Orders

</Link>





<h1 className="text-3xl font-bold my-6">

Order Details

</h1>







<div className="grid md:grid-cols-3 gap-6">






<div className="md:col-span-2 border rounded-xl p-5">


<h2 className="text-xl font-bold mb-5">

Products

</h2>




{
order.items.map(
(item,index)=>(


<div
key={index}
className="flex gap-4 border-b py-4"
>


<img

src={
item.image ||
"/images/no-image.png"
}

alt={item.name}

className="
w-20
h-20
object-cover
rounded
"

/>



<div>

<h3 className="font-semibold">

{item.name}

</h3>


<p>

Qty:
{" "}
{item.quantity}

</p>



<p>

₹{item.price}

</p>



</div>



</div>


)

)

}




</div>








<div className="border rounded-xl p-5">


<h2 className="text-xl font-bold mb-5">

Summary

</h2>




<p>

Status:

<b>

{" "}
{order.orderStatus}

</b>

</p>




<p className="mt-3">

Payment:

{" "}
{order.paymentStatus}

</p>




<p className="text-xl font-bold mt-5">

₹{order.totalAmount}

</p>


<button

onClick={() => {

  window.open(
    `/api/order/invoice/${order._id}`,
    "_blank"
  );

}}

className="
mt-4
w-full
bg-green-600
text-white
py-2
rounded
"

>

Download Invoice

</button>





{
(
order.orderStatus==="Placed" ||
order.orderStatus==="Confirmed"
)

&&

<button

onClick={()=>orderAction("cancel")}

disabled={actionLoading}

className="
mt-5
w-full
bg-red-600
text-white
py-2
rounded
"

>

Cancel Order

</button>

}








{
order.orderStatus==="Delivered"

&&

<div className="mt-5">


<textarea

value={reason}

onChange={(e)=>
setReason(e.target.value)
}

placeholder="Reason"

className="
border
w-full
p-2
rounded
"

/>




<button

onClick={()=>orderAction("return")}

disabled={actionLoading}

className="
mt-3
w-full
bg-black
text-white
py-2
rounded
"

>

Return Request

</button>





<button

onClick={()=>orderAction("exchange")}

disabled={actionLoading}

className="
mt-3
w-full
bg-blue-600
text-white
py-2
rounded
"

>

Exchange Request

</button>



</div>

}





</div>






</div>







<div className="border rounded-xl p-5 mt-6">


<h2 className="text-xl font-bold mb-3">

Delivery Address

</h2>



<p>

{order.shippingAddress.fullName}

</p>



<p>

{order.shippingAddress.mobile}

</p>



<p>

{order.shippingAddress.address},

{order.shippingAddress.area}

</p>



<p>

{order.shippingAddress.city},

{order.shippingAddress.state}

-

{order.shippingAddress.pincode}

</p>



</div>






</div>


);


}
