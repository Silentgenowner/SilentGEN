"use client";

import { useEffect, useState } from "react";
import Link from "next/link";



type Order = {

  _id:string;

  user?:{

    name?:string;

    email?:string;

    mobile?:string;

  };


  totalAmount:number;


  orderStatus:string;


  paymentStatus:string;


  paymentMethod:string;


  createdAt:string;

};





export default function AdminOrdersPage(){



  const [orders,setOrders] =
    useState<Order[]>([]);



  const [loading,setLoading] =
    useState(true);







  useEffect(()=>{

    fetchOrders();

  },[]);







  async function fetchOrders(){



    try{


      const res =
      await fetch(

        "/api/admin/orders",

        {

          credentials:"include",

        }

      );



      const data =
      await res.json();





      if(data.success){

        setOrders(
          data.orders
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







  if(loading){


    return (

      <div className="p-10">

        Loading Orders...

      </div>

    );


  }








  return (

    <div className="p-6">



      <h1 className="text-3xl font-bold mb-6">

        Orders Management

      </h1>







      <div className="overflow-x-auto">


        <table className="w-full border">


          <thead className="bg-gray-100">


            <tr>


              <th className="p-3 border">

                Order ID

              </th>



              <th className="p-3 border">

                Customer

              </th>



              <th className="p-3 border">

                Amount

              </th>



              <th className="p-3 border">

                Status

              </th>



              <th className="p-3 border">

                Payment

              </th>



              <th className="p-3 border">

                Date

              </th>



              <th className="p-3 border">

                Action

              </th>


            </tr>


          </thead>








          <tbody>



          {
            orders.map(
              (order)=>(


              <tr
              key={order._id}
              >



                <td className="p-3 border text-xs">

                  {order._id}

                </td>





                <td className="p-3 border">


                  <p className="font-semibold">

                    {
                      order.user?.name ||
                      "Customer"
                    }

                  </p>


                  <p className="text-sm">

                    {
                      order.user?.email
                    }

                  </p>


                </td>







                <td className="p-3 border">


                  ₹{order.totalAmount}


                </td>







                <td className="p-3 border">


                  <span className="px-3 py-1 rounded bg-gray-100">


                    {
                      order.orderStatus
                    }


                  </span>


                </td>







                <td className="p-3 border">


                  {
                    order.paymentStatus
                  }


                </td>







                <td className="p-3 border">


                  {
                    new Date(
                      order.createdAt
                    )
                    .toDateString()
                  }


                </td>








                <td className="p-3 border">


                  <Link

                    href={
                      `/admin/orders/${order._id}`
                    }


                    className="
                    bg-black
                    text-white
                    px-4
                    py-2
                    rounded
                    "

                  >

                    View

                  </Link>


                </td>





              </tr>


            ))

          }



          </tbody>



        </table>


      </div>



    </div>

  );


}
