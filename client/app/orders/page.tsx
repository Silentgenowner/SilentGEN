"use client";

import { useEffect, useState } from "react";
import Link from "next/link";


type Order = {
  _id: string;

  items: {
    name: string;
    image: string;
    quantity: number;
    price: number;
  }[];

  totalAmount: number;

  orderStatus: string;

  paymentStatus: string;

  createdAt: string;
};



export default function OrdersPage() {


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
          "/api/order/list",
          {
            method:"GET",
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



    }catch(error){

      console.log(error);

    }
    finally{

      setLoading(false);

    }

  }







  if(loading){

    return (

      <div className="p-10 text-center">

        Loading Orders...

      </div>

    );

  }







  return (

    <div className="max-w-6xl mx-auto px-4 py-10">


      <h1 className="text-3xl font-bold mb-8">
        My Orders
      </h1>





      {
        orders.length === 0 ? (


          <div className="border rounded-lg p-8 text-center">

            <h2 className="text-xl font-semibold">
              No Orders Found
            </h2>


            <p className="text-gray-500 mt-2">
              You have not placed any order yet.
            </p>


            <Link
              href="/shop"
              className="inline-block mt-5 bg-black text-white px-6 py-3 rounded"
            >
              Continue Shopping
            </Link>


          </div>


        ) : (



          <div className="space-y-5">


            {
              orders.map((order)=>(


                <div
                  key={order._id}
                  className="border rounded-xl p-5 shadow-sm"
                >



                  <div className="flex justify-between items-center mb-4">


                    <div>

                      <p className="font-semibold">

                        Order ID:
                        {" "}
                        {order._id}

                      </p>


                      <p className="text-sm text-gray-500">

                        {
                          new Date(
                            order.createdAt
                          )
                          .toDateString()
                        }

                      </p>


                    </div>





                    <span
                      className="
                      px-3
                      py-1
                      rounded-full
                      text-sm
                      bg-gray-100
                      "
                    >

                      {order.orderStatus}

                    </span>



                  </div>






                  <div className="space-y-3">


                    {
                      order.items
                      .slice(0,3)
                      .map((item,index)=>(


                        <div
                          key={index}
                          className="flex gap-4 items-center"
                        >


                          <img
                            src={
                              item.image ||
                              "/images/no-image.png"
                            }
                            alt={item.name}
                            className="
                            w-16
                            h-16
                            object-cover
                            rounded
                            "
                          />



                          <div>

                            <p className="font-medium">

                              {item.name}

                            </p>


                            <p className="text-sm text-gray-500">

                              Qty:
                              {" "}
                              {item.quantity}

                            </p>


                          </div>


                        </div>


                      ))

                    }


                  </div>







                  <div className="flex justify-between items-center mt-5">


                    <div>


                      <p className="font-bold text-lg">

                        ₹
                        {order.totalAmount}

                      </p>


                      <p className="text-sm text-gray-500">

                        Payment:
                        {" "}
                        {order.paymentStatus}

                      </p>


                    </div>






                    <Link

                      href={`/orders/${order._id}`}

                      className="
                      bg-black
                      text-white
                      px-5
                      py-2
                      rounded
                      "

                    >

                      View Details

                    </Link>




                  </div>



                </div>


              ))

            }



          </div>


        )

      }



    </div>

  );


}
