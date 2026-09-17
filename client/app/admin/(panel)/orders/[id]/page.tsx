"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import {
  useParams,
} from "next/navigation";

import CustomerDetails from "@/components/admin/order/CustomerDetails";
import ShippingAddress from "@/components/admin/order/ShippingAddress";
import PaymentSummary from "@/components/admin/order/PaymentSummary";
import OrderItems from "@/components/admin/order/OrderItems";
import DeliveryInformation from "@/components/admin/order/DeliveryInformation";
import OrderManagement from "@/components/admin/order/OrderManagement";
import ReturnRequest from "@/components/admin/order/ReturnRequest";
import ExchangeRequest from "@/components/admin/order/ExchangeRequest";
import OrderTimeline from "@/components/admin/order/OrderTimeline";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type OrderUser = {
  _id?: string;

  name?: string;

  email?: string;

  mobile?: string;

  phone?: string;
};

type OrderItem = {
  product?: {
    _id?: string;

    name?: string;

    slug?: string;

    sku?: string;

    thumbnail?: string;

    images?: string[];

    price?: number;

    mrp?: number;
  } | null;

  name: string;

  image: string;

  quantity: number;

  price: number;

  size?: string;

  color?: string;
};

type OrderShippingAddress = {
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

type DeliveryHistoryItem = {
  status: string;

  date: string;

  note?: string;
};

type ReturnRequestData = {
  reason: string;

  status: string;

  requestedAt: string;
};

type ExchangeRequestData = {
  reason: string;

  status: string;

  requestedAt: string;
};

type Order = {
  _id: string;

  user?: OrderUser | null;

  items: OrderItem[];

  shippingAddress:
    OrderShippingAddress;

  paymentMethod: string;

  paymentStatus: string;

  orderStatus: string;

  subtotal: number;

  shippingCharge: number;

  discount: number;

  totalAmount: number;

  trackingNumber?: string;

  courierPartner?: string;

  createdAt: string;

  deliveryHistory:
    DeliveryHistoryItem[];

  returnRequest?:
    ReturnRequestData;

  exchangeRequest?:
    ExchangeRequestData;
};

type OrderApiResponse = {
  success?: boolean;

  order?: Order;

  message?: string;
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function AdminOrderDetailsPage() {
  const params =
    useParams();

  const id =
    typeof params?.id ===
    "string"
      ? params.id
      : Array.isArray(
            params?.id
          )
        ? params.id[0]
        : "";

  const [
    order,
    setOrder,
  ] =
    useState<Order | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD ORDER
  |--------------------------------------------------------------------------
  */

  const loadOrder =
    useCallback(
      async () => {
        if (!id) {
          setError(
            "Invalid order id."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setError("");

          const response =
            await fetch(
              `/api/admin/orders/${id}`,
              {
                method:
                  "GET",

                cache:
                  "no-store",

                credentials:
                  "include",
              }
            );

          const data:
            OrderApiResponse =
              await response.json();

          /*
          |--------------------------------------------------------------------------
          | ERROR
          |--------------------------------------------------------------------------
          */

          if (
            !response.ok ||
            !data?.success ||
            !data?.order
          ) {
            setOrder(
              null
            );

            setError(
              data?.message ||
                `Unable to load order (${response.status}).`
            );

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | NORMALIZE ORDER
          |--------------------------------------------------------------------------
          */

          const loadedOrder =
            data.order;

          setOrder({
            ...loadedOrder,

            items:
              Array.isArray(
                loadedOrder.items
              )
                ? loadedOrder.items
                : [],

            deliveryHistory:
              Array.isArray(
                loadedOrder.deliveryHistory
              )
                ? loadedOrder.deliveryHistory
                : [],

            subtotal:
              Number(
                loadedOrder.subtotal ||
                  0
              ),

            shippingCharge:
              Number(
                loadedOrder.shippingCharge ||
                  0
              ),

            discount:
              Number(
                loadedOrder.discount ||
                  0
              ),

            totalAmount:
              Number(
                loadedOrder.totalAmount ||
                  0
              ),
          });
        } catch (error) {
          console.error(
            "ADMIN ORDER DETAIL LOAD ERROR:",
            error
          );

          setOrder(
            null
          );

          setError(
            "Unable to load order details."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [id]
    );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div
        className="
          p-10
          text-center
        "
      >
        Loading Order...
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (
    error ||
    !order
  ) {
    return (
      <main
        className="
          mx-auto
          max-w-5xl
          p-6
        "
      >
        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-8
            text-center
          "
        >
          <h2
            className="
              text-xl
              font-bold
              text-red-700
            "
          >
            Unable to open order
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-red-600
            "
          >
            {error ||
              "Order not found."}
          </p>

          <Link
            href="/admin/orders"
            className="
              mt-5
              inline-block
              rounded-lg
              bg-black
              px-5
              py-2.5
              text-sm
              font-medium
              text-white
            "
          >
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER FALLBACK
  |--------------------------------------------------------------------------
  */

  const customer =
    order.user || {
      _id: "",
      name:
        order.shippingAddress
          ?.fullName ||
        "Customer",
      email: "",
      mobile:
        order.shippingAddress
          ?.mobile ||
        "",
      phone: "",
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <main
      className="
        mx-auto
        max-w-7xl
        p-6
      "
    >
      {/*
      |--------------------------------------------------------------------------
      | HEADER
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          mb-8
          flex
          flex-wrap
          items-center
          justify-between
          gap-4
        "
      >
        <div>
          <h1
            className="
              text-3xl
              font-bold
            "
          >
            Order Details
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
            "
          >
            #{order._id}
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="
            rounded-lg
            border
            px-5
            py-2
            transition
            hover:bg-gray-50
          "
        >
          Back
        </Link>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | CUSTOMER + SHIPPING
      |--------------------------------------------------------------------------
      */}

      <section
        className="
          mb-8
          grid
          gap-6
          md:grid-cols-2
        "
      >
        <CustomerDetails
          user={
            customer as any
          }
        />

        <ShippingAddress
          address={
            order.shippingAddress
          }
        />
      </section>

      {/*
      |--------------------------------------------------------------------------
      | PAYMENT
      |--------------------------------------------------------------------------
      */}

      <PaymentSummary
        paymentMethod={
          order.paymentMethod
        }
        paymentStatus={
          order.paymentStatus
        }
        subtotal={
          order.subtotal
        }
        shippingCharge={
          order.shippingCharge
        }
        discount={
          order.discount
        }
        totalAmount={
          order.totalAmount
        }
      />

      <div className="mb-8" />

      {/*
      |--------------------------------------------------------------------------
      | ORDER ITEMS
      |--------------------------------------------------------------------------
      */}

      <OrderItems
        items={
          order.items as any
        }
      />

      <div className="mb-8" />

      {/*
      |--------------------------------------------------------------------------
      | DELIVERY INFORMATION
      |--------------------------------------------------------------------------
      */}

      <DeliveryInformation
        courierPartner={
          order.courierPartner
        }
        trackingNumber={
          order.trackingNumber
        }
        createdAt={
          order.createdAt
        }
      />

      <div className="mb-8" />

      {/*
      |--------------------------------------------------------------------------
      | TIMELINE
      |--------------------------------------------------------------------------
      */}

      <OrderTimeline
        history={
          order.deliveryHistory
        }
      />

      <div className="mb-8" />

      {/*
      |--------------------------------------------------------------------------
      | ORDER MANAGEMENT
      |--------------------------------------------------------------------------
      */}

      <OrderManagement
        order={
          order as any
        }
        onUpdated={
          loadOrder
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | DOCUMENT LINKS
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          mt-6
          flex
          flex-wrap
          gap-3
        "
      >
        <Link
          href={`/invoice/${order._id}`}
          target="_blank"
          className="
            rounded-lg
            bg-blue-600
            px-5
            py-3
            text-white
            transition
            hover:bg-blue-700
          "
        >
          View Invoice
        </Link>

        <Link
          href={`/shipping-bill/${order._id}`}
          target="_blank"
          className="
            rounded-lg
            bg-green-600
            px-5
            py-3
            text-white
            transition
            hover:bg-green-700
          "
        >
          View Shipping Bill
        </Link>
      </div>

      <div className="mb-8" />

      {/*
      |--------------------------------------------------------------------------
      | RETURN REQUEST
      |--------------------------------------------------------------------------
      */}

      <ReturnRequest
        orderId={
          order._id
        }
        returnRequest={
          order.returnRequest as any
        }
        onUpdated={
          loadOrder
        }
      />

      <div className="mb-8" />

      {/*
      |--------------------------------------------------------------------------
      | EXCHANGE REQUEST
      |--------------------------------------------------------------------------
      */}

      <ExchangeRequest
        orderId={
          order._id
        }
        exchangeRequest={
          order.exchangeRequest as any
        }
        onUpdated={
          loadOrder
        }
      />
    </main>
  );
}