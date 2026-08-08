"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {

  _id: string;

  user?: {

    _id: string;

    name?: string;

    email?: string;

    mobile?: string;

    phone?: string;

  };

  totalAmount: number;

  paymentMethod: string;

  paymentStatus: string;

  orderStatus: string;

  createdAt: string;

};

export default function AdminOrdersPage() {

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  useEffect(() => {

    loadOrders();

  }, []);

  async function loadOrders() {

    try {

      setLoading(true);

      let url =
        "/api/admin/orders";

      const params =
        new URLSearchParams();

      if (search) {

        params.append(
          "search",
          search
        );

      }

      if (status) {

        params.append(
          "status",
          status
        );

      }

      if (
        params.toString()
      ) {

        url +=
          "?" +
          params.toString();

      }

      const res =
        await fetch(url, {

          cache:
            "no-store",

          credentials:
            "include",

        });

      const data =
        await res.json();

      if (data.success) {

        setOrders(
          data.orders
        );

      }

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {

    const timer =
      setTimeout(() => {

        loadOrders();

      }, 400);

    return () =>
      clearTimeout(timer);

  }, [search, status]);

  if (loading) {

    return (

      <div
        className="
        p-10
        text-center
        "
      >

        Loading Orders...

      </div>

    );

  }

  return (

    <main
      className="
      max-w-7xl
      mx-auto
      p-6
      "
    >

      <div
        className="
        flex
        justify-between
        items-center
        mb-8
        "
      >

        <h1
          className="
          text-3xl
          font-bold
          "
        >

          Order Management

        </h1>

        <span
          className="
          bg-black
          text-white
          px-4
          py-2
          rounded-lg
          "
        >

          Total :
          {" "}
          {orders.length}

        </span>

      </div>
      {/* ==========================
          SEARCH & FILTER
      =========================== */}

      <div
        className="
        grid
        md:grid-cols-3
        gap-4
        mb-8
        "
      >

        <input

          type="text"

          value={search}

          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }

          placeholder="Search Order ID, Customer..."

          className="
          border
          rounded-lg
          px-4
          py-3
          w-full
          "

        />



        <select

          value={status}

          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }

          className="
          border
          rounded-lg
          px-4
          py-3
          w-full
          "

        >

          <option value="">

            All Status

          </option>

          <option value="Placed">

            Placed

          </option>

          <option value="Confirmed">

            Confirmed

          </option>

          <option value="Packed">

            Packed

          </option>

          <option value="Shipped">

            Shipped

          </option>

          <option value="Out For Delivery">

            Out For Delivery

          </option>

          <option value="Delivered">

            Delivered

          </option>

          <option value="Cancelled">

            Cancelled

          </option>

          <option value="Return Requested">

            Return Requested

          </option>

          <option value="Returned">

            Returned

          </option>

          <option value="Exchange Requested">

            Exchange Requested

          </option>

          <option value="Refunded">

            Refunded

          </option>

        </select>



        <button

          onClick={loadOrders}

          className="
          bg-black
          text-white
          rounded-lg
          px-6
          py-3
          "

        >

          Refresh Orders

        </button>

      </div>



      {/* ==========================
          ORDERS TABLE
      =========================== */}

      <div
        className="
        overflow-x-auto
        bg-white
        rounded-xl
        shadow
        "
      >

        <table
          className="
          min-w-full
          "
        >

          <thead
            className="
            bg-gray-100
            "
          >

            <tr>

              <th className="text-left px-5 py-4">

                Order ID

              </th>

              <th className="text-left px-5 py-4">

                Customer

              </th>

              <th className="text-left px-5 py-4">

                Amount

              </th>

              <th className="text-left px-5 py-4">

                Payment

              </th>

              <th className="text-left px-5 py-4">

                Status

              </th>

              <th className="text-left px-5 py-4">

                Date

              </th>

              <th className="text-left px-5 py-4">

                Action

              </th>

            </tr>

          </thead>

          <tbody>
            {

              orders.length === 0 ?

              (

                <tr>

                  <td

                    colSpan={7}

                    className="
                    text-center
                    py-12
                    text-gray-500
                    "

                  >

                    No Orders Found

                  </td>

                </tr>

              )

              :

              (

                orders.map((order) => (

                  <tr

                    key={order._id}

                    className="
                    border-t
                    hover:bg-gray-50
                    "

                  >

                    <td className="px-5 py-4">

                      <div className="font-medium">

                        #{order._id.slice(-8)}

                      </div>

                      <div className="text-xs text-gray-500">

                        {order._id}

                      </div>

                    </td>





                    <td className="px-5 py-4">

                      <div className="font-semibold">

                        {

                          order.user?.name ||

                          "Unknown User"

                        }

                      </div>

                      <div className="text-sm text-gray-500">

                        {

                          order.user?.email ||

                          "-"

                        }

                      </div>

                      <div className="text-sm text-gray-500">

                        {

                          order.user?.mobile ||

                          order.user?.phone ||

                          "-"

                        }

                      </div>

                    </td>





                    <td className="px-5 py-4 font-semibold">

                      ₹{order.totalAmount}

                    </td>





                    <td className="px-5 py-4">

                      <div>

                        {order.paymentMethod}

                      </div>

                      <span

                        className={

                          `inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                            order.paymentStatus === "Paid"
                              ? "bg-green-100 text-green-700"
                              : order.paymentStatus === "Refunded"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`

                        }

                      >

                        {order.paymentStatus}

                      </span>

                    </td>





                    <td className="px-5 py-4">

                      <span

                        className={

                          `inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            order.orderStatus === "Delivered"
                              ? "bg-green-100 text-green-700"
                              : order.orderStatus === "Cancelled"
                              ? "bg-red-100 text-red-700"
                              : order.orderStatus === "Return Requested"
                              ? "bg-orange-100 text-orange-700"
                              : order.orderStatus === "Exchange Requested"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`

                        }

                      >

                        {order.orderStatus}

                      </span>

                    </td>





                    <td className="px-5 py-4">

                      {

                        new Date(

                          order.createdAt

                        ).toLocaleDateString()

                      }

                    </td>





                    <td className="px-5 py-4">

                      <Link

                        href={`/admin/orders/${order._id}`}

                        className="
                        inline-block
                        bg-black
                        text-white
                        px-4
                        py-2
                        rounded-lg
                        text-sm
                        "

                      >

                        View Details

                      </Link>

                    </td>

                  </tr>

                ))

              )

            }
          </tbody>

        </table>

      </div>





      {/* ==========================
          EMPTY MESSAGE
      =========================== */}

      {

        orders.length === 0 &&

        <div
          className="
          mt-8
          text-center
          text-gray-500
          "
        >

          Try changing the search keyword
          or status filter.

        </div>

      }






      {/* ==========================
          PAGE SUMMARY
      =========================== */}

      <div
        className="
        mt-8
        grid
        md:grid-cols-4
        gap-5
        "
      >

        <div
          className="
          bg-white
          shadow
          rounded-xl
          p-5
          "
        >

          <p className="text-gray-500">

            Total Orders

          </p>

          <h2
            className="
            text-3xl
            font-bold
            mt-2
            "
          >

            {orders.length}

          </h2>

        </div>





        <div
          className="
          bg-white
          shadow
          rounded-xl
          p-5
          "
        >

          <p className="text-gray-500">

            Delivered

          </p>

          <h2
            className="
            text-3xl
            font-bold
            mt-2
            text-green-600
            "
          >

            {

              orders.filter(

                order =>

                order.orderStatus ===
                "Delivered"

              ).length

            }

          </h2>

        </div>






        <div
          className="
          bg-white
          shadow
          rounded-xl
          p-5
          "
        >

          <p className="text-gray-500">

            Pending

          </p>

          <h2
            className="
            text-3xl
            font-bold
            mt-2
            text-yellow-600
            "
          >

            {

              orders.filter(

                order =>

                order.orderStatus !==
                "Delivered" &&

                order.orderStatus !==
                "Cancelled"

              ).length

            }

          </h2>

        </div>






        <div
          className="
          bg-white
          shadow
          rounded-xl
          p-5
          "
        >

          <p className="text-gray-500">

            Cancelled

          </p>

          <h2
            className="
            text-3xl
            font-bold
            mt-2
            text-red-600
            "
          >

            {

              orders.filter(

                order =>

                order.orderStatus ===
                "Cancelled"

              ).length

            }

          </h2>

        </div>

      </div>
      {/* ==========================
          ORDER STATUS SUMMARY
      =========================== */}

      <section
        className="
        mt-10
        bg-white
        rounded-xl
        shadow
        p-6
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-6
          "
        >

          Order Status Summary

        </h2>

        <div
          className="
          grid
          md:grid-cols-2
          lg:grid-cols-4
          gap-5
          "
        >

          <div className="border rounded-lg p-5">

            <p className="text-gray-500">

              Placed

            </p>

            <h3 className="text-2xl font-bold mt-2">

              {

                orders.filter(

                  order =>

                  order.orderStatus === "Placed"

                ).length

              }

            </h3>

          </div>





          <div className="border rounded-lg p-5">

            <p className="text-gray-500">

              Shipped

            </p>

            <h3 className="text-2xl font-bold mt-2">

              {

                orders.filter(

                  order =>

                  order.orderStatus === "Shipped"

                ).length

              }

            </h3>

          </div>





          <div className="border rounded-lg p-5">

            <p className="text-gray-500">

              Return Requested

            </p>

            <h3 className="text-2xl font-bold mt-2 text-orange-600">

              {

                orders.filter(

                  order =>

                  order.orderStatus ===
                  "Return Requested"

                ).length

              }

            </h3>

          </div>





          <div className="border rounded-lg p-5">

            <p className="text-gray-500">

              Exchange Requested

            </p>

            <h3 className="text-2xl font-bold mt-2 text-purple-600">

              {

                orders.filter(

                  order =>

                  order.orderStatus ===
                  "Exchange Requested"

                ).length

              }

            </h3>

          </div>

        </div>

      </section>






      {/* ==========================
          ADMIN NOTE
      =========================== */}

      <div
        className="
        mt-8
        rounded-xl
        border
        bg-blue-50
        p-5
        "
      >

        <h3 className="font-bold mb-2">

          Admin Notes

        </h3>

        <ul
          className="
          list-disc
          pl-5
          space-y-2
          text-sm
          text-gray-700
          "
        >

          <li>

            Click <strong>View Details</strong> to update order status.

          </li>

          <li>

            Return and Exchange requests can be approved or rejected from the Order Details page.

          </li>

          <li>

            Tracking Number and Courier Partner can also be updated there.

          </li>

        </ul>

      </div>

     </main>

  );

}
