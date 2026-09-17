"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type OrderItem = {
  name: string;
  image: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
};

type DeliveryHistory = {
  status: string;
  date: string;
  note?: string;
};

type ShippingAddress = {
  fullName: string;
  mobile: string;
  address: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  landmark?: string;
};

type Order = {
  _id: string;

  items: OrderItem[];

  shippingAddress: ShippingAddress;

  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;

  subtotal: number;
  shippingCharge: number;
  discount: number;
  totalAmount: number;

  trackingNumber?: string;
  courierPartner?: string;

  deliveryHistory: DeliveryHistory[];

  createdAt: string;
};

export default function OrderDetailsPage() {

  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [cancelLoading, setCancelLoading] =
    useState(false);

  async function loadOrder() {

    try {

      setLoading(true);

      const res =
        await fetch(

          `/api/order/${id}`,

          {

            cache: "no-store",

            credentials: "include",

          }

        );

      const data =
        await res.json();

      if (data.success) {

        setOrder(data.order);

      } else {

        setError(

          data.message ||

          "Order not found"

        );

      }

    } catch (err) {

      console.log(err);

      setError(

        "Something went wrong"

      );

    } finally {

      setLoading(false);

    }

  }

  async function cancelOrder() {

    if (!order) return;

    const confirmCancel =
      window.confirm(
        "Are you sure you want to cancel this order?"
      );

    if (!confirmCancel) {

      return;

    }

    try {

      setCancelLoading(true);

      const res =
        await fetch(

          "/api/order/cancel",

          {

            method: "POST",

            credentials: "include",

            headers: {

              "Content-Type":
                "application/json",

            },

            body: JSON.stringify({

              orderId: order._id,

            }),

          }

        );

      const data =
        await res.json();

      alert(data.message);

      if (data.success) {

        await loadOrder();

      }

    } catch (error) {

      console.log(error);

      alert("Something went wrong");

    } finally {

      setCancelLoading(false);

    }

  }
  useEffect(() => {

    if (id) {

      loadOrder();

    }

  }, [id]);



  if (loading) {

    return (

      <div
        className="
        min-h-screen
        flex
        items-center
        justify-center
        text-xl
        font-semibold
        "
      >

        Loading Order...

      </div>

    );

  }



  if (error || !order) {

    return (

      <div
        className="
        min-h-screen
        flex
        flex-col
        items-center
        justify-center
        gap-5
        "
      >

        <h2 className="text-2xl font-bold">

          {error}

        </h2>

        <button

          onClick={() =>
            router.push("/account/orders")
          }

          className="
          bg-black
          text-white
          px-6
          py-3
          rounded-lg
          "

        >

          Back To Orders

        </button>

      </div>

    );

  }



  return (

    <main
      className="
      max-w-6xl
      mx-auto
      px-6
      py-10
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

        <div>

          <h1
            className="
            text-4xl
            font-bold
            "
          >

            Order Details

          </h1>

          <p
            className="
            text-gray-500
            mt-2
            "
          >

            Order ID :
            {" "}
            {order._id}

          </p>

        </div>

        <button

          onClick={() =>
            router.push("/account/orders")
          }

          className="
          border
          px-5
          py-2
          rounded-lg
          "

        >

          Back

        </button>

      </div>





      {/* ==========================
          PRODUCTS
      =========================== */}

      <section
        className="
        bg-white
        shadow
        rounded-xl
        p-6
        mb-8
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-6
          "
        >

          Ordered Products

        </h2>

        <div className="space-y-6">

          {

            order.items.map(

              (item, index) => (

                <div

                  key={index}

                  className="
                  flex
                  gap-5
                  border-b
                  pb-5
                  "

                >

                  <img

                    src={
                      item.image ||
                      "/images/no-image.png"
                    }

                    alt={item.name}

                    className="
                    w-24
                    h-24
                    rounded-lg
                    border
                    object-cover
                    "

                  />

                  <div className="flex-1">

                    <h3
                      className="
                      text-lg
                      font-semibold
                      "
                    >

                      {item.name}

                    </h3>

                    <p className="mt-2">

                      Quantity :
                      {" "}
                      {item.quantity}

                    </p>

                    {

                      item.size && (

                        <p>

                          Size :
                          {" "}
                          {item.size}

                        </p>

                      )

                    }

                    {

                      item.color && (

                        <p>

                          Color :
                          {" "}
                          {item.color}

                        </p>

                      )

                    }

                  </div>

                  <div className="text-right">

                    <p
                      className="
                      text-xl
                      font-bold
                      "
                    >

                      ₹{item.price}

                    </p>

                    <p
                      className="
                      text-gray-500
                      "
                    >

                      Total

                    </p>

                    <p
                      className="
                      font-semibold
                      "
                    >

                      ₹
                      {item.price * item.quantity}

                    </p>

                  </div>

                </div>

              )

            )

          }

        </div>

      </section>
      {/* ==========================
          SHIPPING ADDRESS
      =========================== */}

      <section
        className="
        bg-white
        shadow
        rounded-xl
        p-6
        mb-8
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-6
          "
        >

          Shipping Address

        </h2>

        <div className="space-y-2">

          <h3 className="text-lg font-semibold">

            {order.shippingAddress.fullName}

          </h3>

          <p>

            Mobile :
            {" "}
            {order.shippingAddress.mobile}

          </p>

          <p>

            {order.shippingAddress.address}

          </p>

          {

            order.shippingAddress.area && (

              <p>

                {order.shippingAddress.area}

              </p>

            )

          }

          <p>

            {order.shippingAddress.city},
            {" "}
            {order.shippingAddress.state}

          </p>

          <p>

            {order.shippingAddress.country}
            {" - "}
            {order.shippingAddress.pincode}

          </p>

          {

            order.shippingAddress.landmark && (

              <p>

                Landmark :
                {" "}
                {order.shippingAddress.landmark}

              </p>

            )

          }

        </div>

      </section>







      {/* ==========================
          PAYMENT DETAILS
      =========================== */}

      <section
        className="
        bg-white
        shadow
        rounded-xl
        p-6
        mb-8
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-6
          "
        >

          Payment Details

        </h2>

        <div className="space-y-4">

          <div className="flex justify-between">

            <span>

              Payment Method

            </span>

            <strong>

              {order.paymentMethod}

            </strong>

          </div>

          <div className="flex justify-between">

            <span>

              Payment Status

            </span>

            <strong>

              {order.paymentStatus}

            </strong>

          </div>

          <div className="flex justify-between">

            <span>

              Order Status

            </span>

            <strong>

              {order.orderStatus}

            </strong>

          </div>

        </div>

      </section>







      {/* ==========================
          ORDER SUMMARY
      =========================== */}

      <section
        className="
        bg-white
        shadow
        rounded-xl
        p-6
        mb-8
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-6
          "
        >

          Order Summary

        </h2>

        <div className="space-y-4">

          <div className="flex justify-between">

            <span>

              Subtotal

            </span>

            <strong>

              ₹{order.subtotal}

            </strong>

          </div>

          <div className="flex justify-between">

            <span>

              Shipping Charge

            </span>

            <strong>

              ₹{order.shippingCharge}

            </strong>

          </div>

          <div className="flex justify-between">

            <span>

              Discount

            </span>

            <strong>

              ₹{order.discount}

            </strong>

          </div>

          <hr />

          <div
            className="
            flex
            justify-between
            text-2xl
            font-bold
            "
          >

            <span>

              Grand Total

            </span>

            <span>

              ₹{order.totalAmount}

            </span>

          </div>

        </div>

      </section>
      {/* ==========================
          DELIVERY DETAILS
      =========================== */}

      <section
        className="
        bg-white
        shadow
        rounded-xl
        p-6
        mb-8
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-6
          "
        >

          Delivery Details

        </h2>

        <div className="space-y-4">

          <div className="flex justify-between">

            <span>

              Order Date

            </span>

            <strong>

              {
                new Date(
                  order.createdAt
                ).toLocaleDateString()
              }

            </strong>

          </div>

          <div className="flex justify-between">

            <span>

              Current Status

            </span>

            <strong>

              {order.orderStatus}

            </strong>

          </div>

          <div className="flex justify-between">

            <span>

              Courier Partner

            </span>

            <strong>

              {
                order.courierPartner ||
                "Not Assigned"
              }

            </strong>

          </div>

          <div className="flex justify-between">

            <span>

              Tracking Number

            </span>

            <strong>

              {
                order.trackingNumber ||
                "Not Available"
              }

            </strong>

          </div>

        </div>

      </section>






      {/* ==========================
          DELIVERY TIMELINE
      =========================== */}

      <section
        className="
        bg-white
        shadow
        rounded-xl
        p-6
        mb-8
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-8
          "
        >

          Delivery Timeline

        </h2>

        {

          order.deliveryHistory.length === 0 ?

          (

            <p className="text-gray-500">

              No delivery updates available.

            </p>

          )

          :

          (

            <div className="space-y-6">

              {

                order.deliveryHistory.map(

                  (item,index)=>(

                    <div

                      key={index}

                      className="
                      flex
                      gap-5
                      "

                    >

                      <div
                        className="
                        w-4
                        flex
                        justify-center
                        "
                      >

                        <div
                          className="
                          w-3
                          h-3
                          rounded-full
                          bg-black
                          mt-2
                          "
                        />

                      </div>

                      <div className="flex-1">

                        <h3
                          className="
                          font-bold
                          text-lg
                          "
                        >

                          {item.status}

                        </h3>

                        <p
                          className="
                          text-sm
                          text-gray-500
                          "
                        >

                          {

                            new Date(
                              item.date
                            ).toLocaleString()

                          }

                        </p>

                        {

                          item.note &&

                          <p className="mt-2">

                            {item.note}

                          </p>

                        }

                      </div>

                    </div>

                  )

                )

              }

            </div>

          )

        }

      </section>
      {/* ==========================
          ORDER ACTIONS
      =========================== */}

      <section
        className="
        bg-white
        shadow
        rounded-xl
        p-6
        mb-8
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-6
          "
        >

          Order Actions

        </h2>

        <div
          className="
          flex
          flex-wrap
          gap-4
          "
        >

          {(order.orderStatus === "Placed" ||
            order.orderStatus === "Confirmed") && (

            <button

              onClick={cancelOrder}

              disabled={cancelLoading}

              className="
              bg-red-600
              hover:bg-red-700
              text-white
              px-6
              py-3
              rounded-lg
              disabled:opacity-50
              "

            >

              {

                cancelLoading

                  ? "Cancelling..."

                  : "Cancel Order"

              }

            </button>

          )}






          {order.orderStatus === "Delivered" && (

            <button

              onClick={() => {

                router.push(
                  `/account/orders/${order._id}/return`
                );

              }}

              className="
              bg-yellow-500
              hover:bg-yellow-600
              text-white
              px-6
              py-3
              rounded-lg
              "

            >

              Return Request

            </button>

          )}







          {order.orderStatus === "Delivered" && (

            <button

              onClick={() => {

                router.push(
                  `/account/orders/${order._id}/exchange`
                );

              }}

              className="
              bg-blue-600
              hover:bg-blue-700
              text-white
              px-6
              py-3
              rounded-lg
              "

            >

              Exchange Request

            </button>

          )}







          <button

            onClick={() => {

              window.print();

            }}

            className="
            bg-green-600
            hover:bg-green-700
            text-white
            px-6
            py-3
            rounded-lg
            "

          >

            Download Invoice

          </button>








          <button

            onClick={() => {

              router.push(
                "/account/orders"
              );

            }}

            className="
            border
            border-black
            px-6
            py-3
            rounded-lg
            "

          >

            Back To Orders

          </button>

        </div>

      </section>
   
     </main>

  );

}
