"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ExchangeRequestPage() {

  const router = useRouter();

  const params = useParams();

  const id = params.id as string;

  const [reason, setReason] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function submitExchange() {

    if (!reason.trim()) {

      alert(
        "Please enter exchange reason."
      );

      return;

    }

    try {

      setLoading(true);

      const res =
        await fetch(

          "/api/order/exchange",

          {

            method: "POST",

            credentials: "include",

            headers: {

              "Content-Type":
                "application/json",

            },

            body: JSON.stringify({

              orderId: id,

              reason,

            }),

          }

        );

      const data =
        await res.json();

      alert(data.message);

      if (data.success) {

        router.push(

          `/account/orders/${id}`

        );

      }

    } catch (error) {

      console.log(error);

      alert(
        "Something went wrong"
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <main
      className="
      max-w-2xl
      mx-auto
      px-6
      py-10
      "
    >

      <h1
        className="
        text-3xl
        font-bold
        mb-8
        "
      >

        Exchange Request

      </h1>

      <div
        className="
        bg-white
        shadow
        rounded-xl
        p-6
        "
      >

        <label
          className="
          font-semibold
          block
          mb-3
          "
        >

          Reason

        </label>

        <textarea

          value={reason}

          onChange={(e)=>
            setReason(
              e.target.value
            )
          }

          rows={6}

          className="
          w-full
          border
          rounded-lg
          p-4
          "

          placeholder="
Enter exchange reason...
"

        />
        <div
          className="
          flex
          gap-4
          mt-8
          "
        >

          <button

            onClick={submitExchange}

            disabled={loading}

            className="
            flex-1
            bg-black
            text-white
            py-3
            rounded-lg
            disabled:opacity-50
            "

          >

            {

              loading

                ? "Submitting..."

                : "Submit Exchange Request"

            }

          </button>

          <button

            onClick={() => {

              router.back();

            }}

            className="
            flex-1
            border
            py-3
            rounded-lg
            "

          >

            Cancel

          </button>

        </div>

        <div
          className="
          mt-8
          border-t
          pt-6
          text-sm
          text-gray-500
          space-y-2
          "
        >

          <p>

            • Exchange requests are accepted only for delivered orders.

          </p>

          <p>

            • Our team will review your exchange request.

          </p>

          <p>

            • Once approved, you will receive further instructions.

          </p>

          <p>

            • You can check the exchange status from your order details page.

          </p>

        </div>

      </div>

    </main>

  );

}