"use client";


import { useEffect, useState } from "react";
import { useParams } from "next/navigation";


import InvoiceHeader from "@/components/invoice/InvoiceHeader";
import InvoiceCustomer from "@/components/invoice/InvoiceCustomer";
import InvoiceItems from "@/components/invoice/InvoiceItems";
import InvoiceSummary from "@/components/invoice/InvoiceSummary";
import InvoiceQRCode from "@/components/invoice/InvoiceQRCode";
import DownloadInvoice from "@/components/invoice/DownloadInvoice";



type Order = {

  _id:string;

  user:any;

  shippingAddress:any;

  items:any[];

  subtotal:number;

  shippingCharge:number;

  discount:number;

  totalAmount:number;

  createdAt:string;

};



export default function InvoicePage(){


  const params = useParams();


  const id = params.id as string;



  const [order,setOrder] =

  useState<Order | null>(null);



  const [loading,setLoading] =

  useState(true);





  useEffect(()=>{


    if(id){

      fetchOrder();

    }


  },[id]);





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

        Loading Invoice...

      </div>

    );


  }







  if(!order){


    return (

      <div className="p-10 text-center">

        Invoice Not Found

      </div>

    );


  }







  return (

    <main

      className="
      max-w-4xl
      mx-auto
      bg-white
      p-8
      print:p-0
      "

    >



      <InvoiceHeader

        order={order}

      />





      <InvoiceCustomer

        order={order}

      />







      <InvoiceItems

        items={order.items}

      />







      <InvoiceSummary

        orderId={order._id}

        subtotal={order.subtotal}

        shippingCharge={order.shippingCharge}

        discount={order.discount}

        totalAmount={order.totalAmount}

      />








      <div

        className="
        flex
        justify-end
        mt-8
        "

      >

        <InvoiceQRCode

          orderId={order._id}

        />

      </div>






      <button

        onClick={()=>window.print()}

        className="
        mt-8
        bg-black
        text-white
        px-6
        py-3
        rounded-lg
        print:hidden
        "

      >

        Print Invoice

      </button>



      <DownloadInvoice

      invoiceId={order._id}

     />



    </main>

  );


}
