"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

type ShippingAddress = {
  fullName?: string;

  mobile?: string;

  address?: string;

  area?: string;

  city?: string;

  state?: string;

  country?: string;

  pincode?: string;
};

type Order = {
  _id: string;

  user?: OrderUser | null;

  shippingAddress?: ShippingAddress;

  totalAmount?: number;

  subtotal?: number;

  grandTotal?: number;

  paymentMethod?: string;

  paymentStatus?: string;

  orderStatus?: string;

  trackingNumber?: string;

  courierPartner?: string;

  invoiceNo?: string;

  createdAt?: string;
};

type OrdersResponse = {
  success?: boolean;

  message?: string;

  totalOrders?: number;

  orders?: Order[];
};

/*
|--------------------------------------------------------------------------
| ORDER STATUS OPTIONS
|--------------------------------------------------------------------------
*/

const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Returned",
  "Exchange Requested",
  "Exchange Approved",
  "Exchange Completed",
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getCustomerName(
  order: Order
) {
  return (
    order.user?.name ||
    order.shippingAddress
      ?.fullName ||
    "Customer"
  );
}

function getCustomerMobile(
  order: Order
) {
  return (
    order.user?.mobile ||
    order.user?.phone ||
    order.shippingAddress
      ?.mobile ||
    "-"
  );
}

function getOrderAmount(
  order: Order
) {
  return Number(
    order.totalAmount ??
      order.grandTotal ??
      order.subtotal ??
      0
  );
}

function getStatusClass(
  status: string
) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-700";

    case "Cancelled":
      return "bg-red-100 text-red-700";

    case "Return Requested":
      return "bg-orange-100 text-orange-700";

    case "Returned":
      return "bg-orange-100 text-orange-800";

    case "Exchange Requested":
      return "bg-purple-100 text-purple-700";

    case "Exchange Approved":
      return "bg-purple-100 text-purple-800";

    case "Exchange Completed":
      return "bg-green-100 text-green-700";

    case "Shipped":
      return "bg-blue-100 text-blue-700";

    case "Out For Delivery":
      return "bg-cyan-100 text-cyan-700";

    case "Packed":
      return "bg-indigo-100 text-indigo-700";

    case "Confirmed":
      return "bg-yellow-100 text-yellow-700";

    case "Placed":
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function AdminOrdersPage() {
  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD ORDERS
  |--------------------------------------------------------------------------
  */

  const loadOrders =
    useCallback(
      async (
        manualRefresh =
          false
      ) => {
        try {
          if (
            manualRefresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError("");

          const params =
            new URLSearchParams();

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (status) {
            params.set(
              "status",
              status
            );
          }

          let url =
            "/api/admin/orders";

          const query =
            params.toString();

          if (query) {
            url +=
              `?${query}`;
          }

          const response =
            await fetch(
              url,
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
            OrdersResponse =
              await response.json();

          /*
          |--------------------------------------------------------------------------
          | API ERROR
          |--------------------------------------------------------------------------
          */

          if (
            !response.ok ||
            !data?.success
          ) {
            setOrders([]);

            setError(
              data?.message ||
                `Unable to load orders (${response.status}).`
            );

            return;
          }

          setOrders(
            Array.isArray(
              data.orders
            )
              ? data.orders
              : []
          );
        } catch (error) {
          console.error(
            "ADMIN ORDERS LOAD ERROR:",
            error
          );

          setOrders([]);

          setError(
            "Unable to load orders. Please try again."
          );
        } finally {
          setLoading(false);

          setRefreshing(
            false
          );
        }
      },
      [
        search,
        status,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | FIRST LOAD + SEARCH DEBOUNCE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadOrders();
        },
        350
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [loadOrders]);

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary =
    useMemo(() => {
      return {
        total:
          orders.length,

        delivered:
          orders.filter(
            (order) =>
              order.orderStatus ===
              "Delivered"
          ).length,

        pending:
          orders.filter(
            (order) =>
              order.orderStatus !==
                "Delivered" &&
              order.orderStatus !==
                "Cancelled" &&
              order.orderStatus !==
                "Returned"
          ).length,

        cancelled:
          orders.filter(
            (order) =>
              order.orderStatus ===
              "Cancelled"
          ).length,

        placed:
          orders.filter(
            (order) =>
              order.orderStatus ===
              "Placed"
          ).length,

        shipped:
          orders.filter(
            (order) =>
              order.orderStatus ===
              "Shipped"
          ).length,

        returnRequested:
          orders.filter(
            (order) =>
              order.orderStatus ===
              "Return Requested"
          ).length,

        exchangeRequested:
          orders.filter(
            (order) =>
              order.orderStatus ===
              "Exchange Requested"
          ).length,
      };
    }, [orders]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading Orders...
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold">
          Order Management
        </h1>

        <span
          className="
            rounded-lg
            bg-black
            px-4
            py-2
            text-sm
            font-semibold
            text-white
          "
        >
          Total:{" "}
          {
            summary.total
          }
        </span>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */}

      {error && (
        <div
          className="
            mb-6
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-4
            text-sm
            font-medium
            text-red-700
          "
        >
          {error}
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | SEARCH
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          mb-8
          grid
          gap-4
          md:grid-cols-3
        "
      >
        <input
          type="text"
          value={search}
          onChange={(
            event
          ) =>
            setSearch(
              event.target
                .value
            )
          }
          placeholder="Search Order ID, Customer, Mobile..."
          className="
            w-full
            rounded-lg
            border
            px-4
            py-3
            outline-none
            focus:border-black
          "
        />

        <select
          value={status}
          onChange={(
            event
          ) =>
            setStatus(
              event.target
                .value
            )
          }
          className="
            w-full
            rounded-lg
            border
            bg-white
            px-4
            py-3
            outline-none
            focus:border-black
          "
        >
          <option value="">
            All Status
          </option>

          {ORDER_STATUSES.map(
            (
              orderStatus
            ) => (
              <option
                key={
                  orderStatus
                }
                value={
                  orderStatus
                }
              >
                {
                  orderStatus
                }
              </option>
            )
          )}
        </select>

        <button
          type="button"
          disabled={
            refreshing
          }
          onClick={() =>
            void loadOrders(
              true
            )
          }
          className="
            rounded-lg
            bg-black
            px-6
            py-3
            font-medium
            text-white
            transition
            hover:bg-gray-800
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh Orders"}
        </button>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | TABLE
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          overflow-x-auto
          rounded-xl
          bg-white
          shadow
        "
      >
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-4 text-left">
                Order ID
              </th>

              <th className="px-5 py-4 text-left">
                Customer
              </th>

              <th className="px-5 py-4 text-left">
                Amount
              </th>

              <th className="px-5 py-4 text-left">
                Payment
              </th>

              <th className="px-5 py-4 text-left">
                Status
              </th>

              <th className="px-5 py-4 text-left">
                Date
              </th>

              <th className="px-5 py-4 text-left">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.length ===
            0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="
                    px-5
                    py-14
                    text-center
                    text-gray-500
                  "
                >
                  {error
                    ? "Orders could not be loaded."
                    : "No Orders Found"}
                </td>
              </tr>
            ) : (
              orders.map(
                (order) => {
                  const amount =
                    getOrderAmount(
                      order
                    );

                  const orderStatus =
                    order.orderStatus ||
                    "Placed";

                  const paymentStatus =
                    order.paymentStatus ||
                    "Pending";

                  return (
                    <tr
                      key={
                        order._id
                      }
                      className="
                        border-t
                        hover:bg-gray-50
                      "
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold">
                          #
                          {order._id.slice(
                            -8
                          )}
                        </div>

                        <div
                          className="
                            mt-1
                            max-w-[180px]
                            truncate
                            text-xs
                            text-gray-400
                          "
                          title={
                            order._id
                          }
                        >
                          {
                            order._id
                          }
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold">
                          {getCustomerName(
                            order
                          )}
                        </div>

                        {order.user
                          ?.email && (
                          <div className="text-sm text-gray-500">
                            {
                              order
                                .user
                                .email
                            }
                          </div>
                        )}

                        <div className="text-sm text-gray-500">
                          {getCustomerMobile(
                            order
                          )}
                        </div>
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                          font-semibold
                        "
                      >
                        ₹
                        {amount.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {order.paymentMethod ||
                            "COD"}
                        </div>

                        <span
                          className={`
                            mt-1
                            inline-block
                            rounded
                            px-2
                            py-1
                            text-xs
                            font-medium

                            ${
                              paymentStatus ===
                              "Paid"
                                ? "bg-green-100 text-green-700"
                                : paymentStatus ===
                                    "Refunded"
                                  ? "bg-blue-100 text-blue-700"
                                  : paymentStatus ===
                                      "Failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                            }
                          `}
                        >
                          {
                            paymentStatus
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`
                            inline-block
                            whitespace-nowrap
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-semibold

                            ${getStatusClass(
                              orderStatus
                            )}
                          `}
                        >
                          {
                            orderStatus
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {order.createdAt
                          ? new Date(
                              order.createdAt
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "-"}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="
                            inline-block
                            whitespace-nowrap
                            rounded-lg
                            bg-black
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:bg-gray-800
                          "
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | SUMMARY
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          mt-8
          grid
          gap-5
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-gray-500">
            Total Orders
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {
              summary.total
            }
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-gray-500">
            Delivered
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {
              summary.delivered
            }
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-gray-500">
            Pending
          </p>

          <h2 className="mt-2 text-3xl font-bold text-yellow-600">
            {
              summary.pending
            }
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-gray-500">
            Cancelled
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {
              summary.cancelled
            }
          </h2>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | STATUS SUMMARY
      |--------------------------------------------------------------------------
      */}

      <section
        className="
          mt-10
          rounded-xl
          bg-white
          p-6
          shadow
        "
      >
        <h2 className="mb-6 text-2xl font-bold">
          Order Status Summary
        </h2>

        <div
          className="
            grid
            gap-5
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          <div className="rounded-lg border p-5">
            <p className="text-gray-500">
              Placed
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {
                summary.placed
              }
            </h3>
          </div>

          <div className="rounded-lg border p-5">
            <p className="text-gray-500">
              Shipped
            </p>

            <h3 className="mt-2 text-2xl font-bold text-blue-600">
              {
                summary.shipped
              }
            </h3>
          </div>

          <div className="rounded-lg border p-5">
            <p className="text-gray-500">
              Return Requested
            </p>

            <h3 className="mt-2 text-2xl font-bold text-orange-600">
              {
                summary.returnRequested
              }
            </h3>
          </div>

          <div className="rounded-lg border p-5">
            <p className="text-gray-500">
              Exchange Requested
            </p>

            <h3 className="mt-2 text-2xl font-bold text-purple-600">
              {
                summary.exchangeRequested
              }
            </h3>
          </div>
        </div>
      </section>
    </main>
  );
}