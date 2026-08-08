"use client";


import { useEffect, useState } from "react";
import { useParams } from "next/navigation";


import ShippingHeader from "@/components/shipping/ShippingHeader";
import ShippingCustomer from "@/components/shipping/ShippingCustomer";
import ShippingItems from "@/components/shipping/ShippingItems";
import ShippingSummary from "@/components/shipping/ShippingSummary";
import ShippingQRCode from "@/components/shipping/ShippingQRCode";



export default function ShippingBillPage(){


  const params = useParams();


  const id = params.id as string;



  const [order,setOrder] =

    useState<any>(null);



  const [loading,setLoading] =

    useState(true);





  useEffect(()=>{


    fetchOrder();


  },[]);





  async function fetchOrder(){


    try{


      const res = await fetch(

        `/api/orders/${id}`,

        {

          credentials:"include",

          cache:"no-store"

        }

      );



      const data = await res.json();



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







  if(loading){


    return (

      <div className="p-10 text-center">

        Loading Shipping Bill...

      </div>

    );


  }






  if(!order){


    return (

      <div className="p-10 text-center">

        Shipping Bill Not Found

      </div>

    );


  }








  return (

    <main

      id="shipping-bill"

      className="
      max-w-4xl
      mx-auto
      bg-white
      p-8
      "

    >



      <ShippingHeader

        order={order}

      />





      <ShippingCustomer

        order={order}

      />





      <ShippingItems

        items={order.items}

      />





      <ShippingSummary

        order={order}

      />





      <ShippingQRCode

        orderId={order._id}

      />





    </main>

  );


}
