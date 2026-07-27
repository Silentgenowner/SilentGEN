"use client";

import { useState } from "react";


export default function SettingsPage() {


  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);



  return (

    <div className="max-w-4xl mx-auto px-6 py-10">


      <h1 className="text-3xl font-bold mb-8">
        Account Settings
      </h1>



      <div className="border rounded-xl p-6 space-y-6">


        <div className="flex items-center justify-between">

          <div>

            <h2 className="font-semibold text-lg">
              Order Notifications
            </h2>

            <p className="text-gray-500">
              Receive updates about your orders
            </p>

          </div>



          <button
            onClick={() =>
              setNotifications(!notifications)
            }
            className={`px-5 py-2 rounded-lg text-white ${
              notifications
                ? "bg-black"
                : "bg-gray-400"
            }`}
          >
            {
              notifications
                ? "ON"
                : "OFF"
            }
          </button>


        </div>




        <div className="flex items-center justify-between">


          <div>

            <h2 className="font-semibold text-lg">
              Marketing Emails
            </h2>

            <p className="text-gray-500">
              Receive offers and promotions
            </p>

          </div>



          <button
            onClick={() =>
              setMarketing(!marketing)
            }
            className={`px-5 py-2 rounded-lg text-white ${
              marketing
                ? "bg-black"
                : "bg-gray-400"
            }`}
          >
            {
              marketing
                ? "ON"
                : "OFF"
            }
          </button>


        </div>




        <div className="border-t pt-6">


          <h2 className="font-semibold text-lg mb-3">
            Account Actions
          </h2>



          <button
            className="border border-red-500 text-red-500 px-6 py-3 rounded-lg hover:bg-red-500 hover:text-white transition"
          >
            Delete Account
          </button>


        </div>



      </div>


    </div>

  );

}
