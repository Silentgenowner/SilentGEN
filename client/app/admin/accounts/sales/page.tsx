"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Receipt,
  Loader2,
  Eye,
} from "lucide-react";


type Invoice = {
  _id: string;
  invoiceNumber: string;

  customerName: string;

  grandTotal: number;

  paymentStatus:
    | "unpaid"
    | "partial"
    | "paid";

  invoiceDate: string;
};


type InvoiceResponse = {
  success: boolean;

  invoices: Invoice[];
};



export default function SalesInvoicePage() {


  const [loading,setLoading] =
  useState(true);


  const [invoices,setInvoices] =
  useState<Invoice[]>([]);



  const [search,setSearch] =
  useState("");





  useEffect(()=>{

    loadInvoices();

  },[]);






  async function loadInvoices(){


    try{


      setLoading(true);


      const res =
      await fetch(
        "/api/admin/accounts/sales",
        {
          cache:"no-store",
        }
      );



      const data:InvoiceResponse =
      await res.json();



      if(data.success){

        setInvoices(
          data.invoices || []
        );

      }



    }
    catch(error){

      console.log(
        "INVOICE LOAD ERROR",
        error
      );

    }
    finally{

      setLoading(false);

    }


  }





  const filteredInvoices =
  invoices.filter((invoice)=>{


    const text =
    search.toLowerCase();



    return (

      invoice.invoiceNumber
      .toLowerCase()
      .includes(text)

      ||

      invoice.customerName
      .toLowerCase()
      .includes(text)

    );


  });







  return (

    <div
    className="
    space-y-8
    "
    >



      <div
      className="
      flex
      flex-col
      gap-4
      md:flex-row
      md:items-center
      md:justify-between
      "
      >



        <div>

          <h1
          className="
          text-3xl
          font-bold
          "
          >

            Sales Invoice

          </h1>


          <p
          className="
          text-gray-500
          mt-2
          "
          >

            Manage customer invoices

          </p>


        </div>





        <Link

        href="/admin/accounts/sales/new"

        className="
        flex
        items-center
        gap-2
        rounded-xl
        bg-black
        px-5
        py-3
        text-white
        "
        >

          <Plus size={20}/>

          Create Invoice


        </Link>




      </div>







      <div
      className="
      rounded-2xl
      border
      bg-white
      p-5
      shadow-sm
      "
      >



        <div
        className="
        flex
        items-center
        gap-3
        border
        rounded-xl
        px-4
        py-3
        "
        >

          <Search size={20}/>


          <input

          value={search}

          onChange={(e)=>
          setSearch(e.target.value)
          }

          placeholder="
          Search invoice number or customer...
          "

          className="
          flex-1
          outline-none
          "

          />


        </div>



      </div>








      <div
      className="
      rounded-2xl
      border
      bg-white
      shadow-sm
      overflow-hidden
      "
      >





      {
        loading ?

        (

          <div
          className="
          flex
          justify-center
          py-20
          "
          >

            <Loader2
            className="
            animate-spin
            "
            />

          </div>

        )


        :


        filteredInvoices.length===0 ?

        (

          <div
          className="
          py-20
          text-center
          text-gray-500
          "
          >

            <Receipt
            size={40}
            className="
            mx-auto
            mb-3
            "
            />


            No invoices found.


          </div>

        )


        :


        (

        <div
        className="
        overflow-x-auto
        "
        >

        <table
        className="
        w-full
        "
        >

        <thead
        className="
        bg-gray-50
        "
        >

        <tr>


        <th
        className="
        p-4
        text-left
        "
        >

        Invoice No

        </th>


        <th
        className="
        p-4
        text-left
        "
        >

        Customer

        </th>



        <th
        className="
        p-4
        text-left
        "
        >

        Amount

        </th>




        <th
        className="
        p-4
        text-left
        "
        >

        Status

        </th>



        <th
        className="
        p-4
        text-left
        "
        >

        Date

        </th>



        <th
        className="
        p-4
        text-left
        "
        >

        Action

        </th>



        </tr>

        </thead>





        <tbody>


        {
          filteredInvoices.map((invoice)=>(


          <tr
          key={invoice._id}
          className="
          border-t
          "
          >


          <td
          className="
          p-4
          font-semibold
          "
          >

          {invoice.invoiceNumber}

          </td>



          <td
          className="
          p-4
          "
          >

          {invoice.customerName}

          </td>




          <td
          className="
          p-4
          font-semibold
          "
          >

          ₹
          {invoice.grandTotal
          .toLocaleString("en-IN")}

          </td>





          <td
          className="
          p-4
          "
          >

          <span
          className={`
          rounded-full
          px-3
          py-1
          text-xs
          font-semibold
          ${
            invoice.paymentStatus==="paid"
            ?
            "bg-green-100 text-green-700"
            :
            invoice.paymentStatus==="partial"
            ?
            "bg-yellow-100 text-yellow-700"
            :
            "bg-red-100 text-red-700"
          }
          `}
          >

          {invoice.paymentStatus}

          </span>


          </td>




          <td
          className="
          p-4
          "
          >

          {
            new Date(
              invoice.invoiceDate
            )
            .toLocaleDateString("en-IN")
          }


          </td>





          <td
          className="
          p-4
          "
          >


          <Link

          href={
          `/admin/accounts/sales/${invoice._id}`
          }

          className="
          inline-flex
          items-center
          gap-2
          rounded-lg
          border
          px-3
          py-2
          text-sm
          "
          >

          <Eye size={16}/>

          View


          </Link>



          </td>




          </tr>


          ))

        }


        </tbody>


        </table>


        </div>

        )

      }





      </div>





    </div>

  );

}