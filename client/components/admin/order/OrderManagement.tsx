"use client";

import {
  useEffect,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Order = {
  _id: string;

  orderStatus: string;

  trackingNumber?: string;

  courierPartner?: string;
};

type Props = {
  order: Order;

  onUpdated:
    () =>
      void | Promise<void>;
};

type ApiResponse = {
  success?: boolean;

  message?: string;
};

/*
|--------------------------------------------------------------------------
| STATUS OPTIONS
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
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function OrderManagement({
  order,
  onUpdated,
}: Props) {
  const [
    status,
    setStatus,
  ] =
    useState("");

  const [
    trackingNumber,
    setTrackingNumber,
  ] =
    useState("");

  const [
    courierPartner,
    setCourierPartner,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | SYNC ORDER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setStatus(
      order.orderStatus ||
        "Placed"
    );

    setTrackingNumber(
      order.trackingNumber ||
        ""
    );

    setCourierPartner(
      order.courierPartner ||
        ""
    );
  }, [order]);

  /*
  |--------------------------------------------------------------------------
  | SAFE JSON
  |--------------------------------------------------------------------------
  */

  async function readJson(
    response: Response
  ): Promise<ApiResponse> {
    const text =
      await response.text();

    if (!text) {
      return {
        success:
          response.ok,
      };
    }

    try {
      return JSON.parse(
        text
      ) as ApiResponse;
    } catch {
      return {
        success: false,

        message:
          `Invalid server response (${response.status}).`,
      };
    }
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE STATUS
  |--------------------------------------------------------------------------
  */

  async function updateStatus() {
    const response =
      await fetch(
        `/api/admin/orders/${order._id}/status`,
        {
          method:
            "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              status,
            }),
        }
      );

    const data =
      await readJson(
        response
      );

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
          `Unable to update order status (${response.status}).`
      );
    }

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE TRACKING
  |--------------------------------------------------------------------------
  */

  async function updateTracking() {
    const courier =
      courierPartner.trim();

    const tracking =
      trackingNumber.trim();

    /*
    |--------------------------------------------------------------------------
    | NOTHING ENTERED
    |--------------------------------------------------------------------------
    */

    if (
      !courier &&
      !tracking
    ) {
      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | BOTH REQUIRED
    |--------------------------------------------------------------------------
    */

    if (
      !courier ||
      !tracking
    ) {
      throw new Error(
        "Please enter both Courier Partner and Tracking Number."
      );
    }

    const response =
      await fetch(
        `/api/admin/orders/${order._id}/tracking`,
        {
          method:
            "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              courierPartner:
                courier,

              trackingNumber:
                tracking,
            }),
        }
      );

    const data =
      await readJson(
        response
      );

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
          `Unable to update tracking (${response.status}).`
      );
    }

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE ORDER
  |--------------------------------------------------------------------------
  */

  async function updateOrder() {
    try {
      setLoading(
        true
      );

      setError("");

      setMessage("");

      /*
      |--------------------------------------------------------------------------
      | STATUS
      |--------------------------------------------------------------------------
      */

      await updateStatus();

      /*
      |--------------------------------------------------------------------------
      | TRACKING
      |--------------------------------------------------------------------------
      */

      const trackingResult =
        await updateTracking();

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      setMessage(
        trackingResult
          ? "Order status and tracking details updated successfully."
          : "Order status updated successfully."
      );

      await onUpdated();
    } catch (error) {
      console.error(
        "ORDER UPDATE ERROR:",
        error
      );

      setError(
        error instanceof
        Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section
      className="
        mb-8
        rounded-xl
        bg-white
        p-6
        shadow
      "
    >
      <h2
        className="
          mb-6
          text-xl
          font-bold
        "
      >
        Order Management
      </h2>

      {/*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */}

      {message && (
        <div
          className="
            mb-5
            rounded-lg
            border
            border-green-200
            bg-green-50
            px-4
            py-3
            text-sm
            font-medium
            text-green-700
          "
        >
          {message}
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */}

      {error && (
        <div
          className="
            mb-5
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            font-medium
            text-red-700
          "
        >
          {error}
        </div>
      )}

      <div
        className="
          grid
          gap-5
          md:grid-cols-3
        "
      >
        {/*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */}

        <div>
          <label
            className="
              mb-2
              block
              font-semibold
            "
          >
            Order Status
          </label>

          <select
            value={
              status
            }
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
              p-3
              outline-none
              focus:border-black
            "
          >
            {ORDER_STATUSES.map(
              (
                item
              ) => (
                <option
                  key={
                    item
                  }
                  value={
                    item
                  }
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | TRACKING NUMBER
        |--------------------------------------------------------------------------
        */}

        <div>
          <label
            className="
              mb-2
              block
              font-semibold
            "
          >
            Tracking Number
          </label>

          <input
            type="text"
            value={
              trackingNumber
            }
            onChange={(
              event
            ) =>
              setTrackingNumber(
                event.target
                  .value
              )
            }
            placeholder="Tracking Number"
            className="
              w-full
              rounded-lg
              border
              p-3
              outline-none
              focus:border-black
            "
          />
        </div>

        {/*
        |--------------------------------------------------------------------------
        | COURIER PARTNER
        |--------------------------------------------------------------------------
        */}

        <div>
          <label
            className="
              mb-2
              block
              font-semibold
            "
          >
            Courier Partner
          </label>

          <input
            type="text"
            value={
              courierPartner
            }
            onChange={(
              event
            ) =>
              setCourierPartner(
                event.target
                  .value
              )
            }
            placeholder="Courier Partner"
            className="
              w-full
              rounded-lg
              border
              p-3
              outline-none
              focus:border-black
            "
          />
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | BUTTON
      |--------------------------------------------------------------------------
      */}

      <div className="mt-6">
        <button
          type="button"
          onClick={() =>
            void updateOrder()
          }
          disabled={
            loading
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
            disabled:opacity-50
          "
        >
          {loading
            ? "Updating..."
            : "Update Order"}
        </button>
      </div>
    </section>
  );
}