"use client";


type Props = {

  order:any;

};


export default function ShippingHeader({

  order

}:Props){


  return (

    <div className="border-b pb-5 mb-6">


      <h1 className="text-3xl font-bold">

        SILENTGEN

      </h1>


      <p className="text-gray-500">

        Shipping Bill

      </p>



      <div className="mt-4">


        <p>

          Order ID:

          {" "}

          {order._id}

        </p>


        <p>

          Date:

          {" "}

          {new Date(

            order.createdAt

          ).toLocaleDateString()}

        </p>


      </div>



    </div>

  );


}
