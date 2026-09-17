"use client";

import { useEffect, useState } from "react";


type Notification = {
  _id: string;
  title: string;
  message: string;
  createdAt?: string;
  read?: boolean;
};


export default function NotificationsPage() {


  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {

    fetchNotifications();

  }, []);




  async function fetchNotifications() {

    try {

      const res = await fetch(
        "/api/notifications",
        {
          cache: "no-store",
        }
      );


      const data = await res.json();



      if(data.success){

        setNotifications(
          data.notifications || []
        );

      }



    } catch(error){

      console.log(
        "NOTIFICATION ERROR",
        error
      );


    } finally {

      setLoading(false);

    }

  }





  if(loading){

    return (

      <div className="text-center py-10">

        Loading Notifications...

      </div>

    );

  }





  return (

    <div className="max-w-5xl mx-auto px-6 py-10">


      <h1 className="text-3xl font-bold mb-8">

        Notifications

      </h1>




      {
        notifications.length === 0 ? (

          <div className="border rounded-xl p-10 text-center">

            <p className="text-gray-500">

              No notifications available

            </p>

          </div>


        ) : (


          <div className="space-y-4">


            {
              notifications.map((item)=>(


                <div
                  key={item._id}
                  className="border rounded-xl p-5"
                >


                  <h2 className="font-semibold text-lg">

                    {item.title}

                  </h2>



                  <p className="text-gray-600 mt-2">

                    {item.message}

                  </p>



                  {
                    item.createdAt && (

                      <p className="text-sm text-gray-400 mt-3">

                        {
                          new Date(
                            item.createdAt
                          ).toLocaleDateString()
                        }

                      </p>

                    )
                  }



                </div>


              ))
            }


          </div>


        )
      }




    </div>

  );

}
