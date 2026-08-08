"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import CustomerDetails from "@/components/admin/order/CustomerDetails";
import ShippingAddress from "@/components/admin/order/ShippingAddress";
import PaymentSummary from "@/components/admin/order/PaymentSummary";
import OrderItems from "@/components/admin/order/OrderItems";
import DeliveryInformation from "@/components/admin/order/DeliveryInformation";
import OrderManagement from "@/components/admin/order/OrderManagement";
import ReturnRequest from "@/components/admin/order/ReturnRequest";
import ExchangeRequest from "@/components/admin/order/ExchangeRequest";
import OrderTimeline from "@/components/admin/order/OrderTimeline";

type Order = {
  _id: string;

  user: {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
    phone?: string;
  };

  items: {
    product?: {
      _id: string;
      name: string;
    };

    name: string;
    image: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }[];

  shippingAddress: {
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

  deliveryHistory: {
    status: string;
    date: string;
    note?: string;
  }[];

  returnRequest?: {
    reason: string;
    status: string;
    requestedAt: string;
  };

  exchangeRequest?: {
    reason: string;
    status: string;
    requestedAt: string;
  };
};

export default function AdminOrderDetailsPage() {
  const params = useParams();

  const id = params.id as string;

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function loadOrder() {
    try {
      const res = await fetch(
        `/api/admin/orders/${id}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, []);
  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading Order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-10 text-center">
        Order not found.
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-6">

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-3xl font-bold">
            Order Details
          </h1>

          <p className="text-gray-500">
            #{order._id}
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="border px-5 py-2 rounded-lg"
        >
          Back
        </Link>

      </div>

      <section className="grid md:grid-cols-2 gap-6 mb-8">

        <CustomerDetails
          user={order.user}
        />

        <ShippingAddress
          address={order.shippingAddress}
        />

      </section>

      <PaymentSummary
        paymentMethod={order.paymentMethod}
        paymentStatus={order.paymentStatus}
        subtotal={order.subtotal}
        shippingCharge={order.shippingCharge}
        discount={order.discount}
        totalAmount={order.totalAmount}
      />

      <div className="mb-8" />

      <OrderItems
        items={order.items}
      />

      <div className="mb-8" />

      <DeliveryInformation
        courierPartner={order.courierPartner}
        trackingNumber={order.trackingNumber}
        createdAt={order.createdAt}
      />

      <div className="mb-8" />

      <OrderTimeline
        history={order.deliveryHistory}
      />

      <div className="mb-8" />

      <OrderManagement
        order={order}
        onUpdated={loadOrder}
      />
      <div className="flex flex-wrap gap-3 mt-6">

       <Link
        href={`/invoice/${order._id}`}
        target="_blank"
        className="bg-blue-600 text-white px-5 py-3 rounded-lg"
       >
         View Invoice
        
        </Link>

        <Link
         href={`/shipping-bill/${order._id}`}
         target="_blank"
         className="bg-green-600 text-white px-5 py-3 rounded-lg"
         >
        
        View Shipping Bill
        </Link>

        </div>

      <div className="mb-8" />

      <ReturnRequest
        orderId={order._id}
        returnRequest={order.returnRequest}
        onUpdated={loadOrder}
      />

      <div className="mb-8" />

      <ExchangeRequest
        orderId={order._id}
        exchangeRequest={order.exchangeRequest}
        onUpdated={loadOrder}
 
     />
    </main>
  );
}