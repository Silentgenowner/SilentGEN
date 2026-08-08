"use client";


type Props = {

  order:any;

};



export default function InvoiceCustomer({

  order

}:Props){


  const address = order.shippingAddress;



  return (

    <section

      className="
      grid
      md:grid-cols-2
      gap-6
      mb-8
      "

    >



      {/* CUSTOMER */}

      <div

        className="
        border
        rounded-lg
        p-5
        "

      >

        <h2

          className="
          text-lg
          font-bold
          mb-3
          "

        >

          Customer Details

        </h2>


        <p>

          Name:

          {" "}

          {order.user?.name || "-"}

        </p>



        <p className="mt-2">

          Email:

          {" "}

          {order.user?.email || "-"}

        </p>



        <p className="mt-2">

          Mobile:

          {" "}

          {order.user?.mobile || "-"}

        </p>


      </div>





      {/* SHIPPING ADDRESS */}


      <div

        className="
        border
        rounded-lg
        p-5
        "

      >

        <h2

          className="
          text-lg
          font-bold
          mb-3
          "

        >

          Shipping Address

        </h2>



        <p>

          {address?.fullName}

        </p>



        <p className="mt-2">

          {address?.mobile}

        </p>



        <p className="mt-2">

          {address?.address}

        </p>



        <p>

          {address?.area}

        </p>



        <p>

          {address?.city},

          {" "}

          {address?.state}

        </p>



        <p>

          {address?.country}

          {" - "}

          {address?.pincode}

        </p>



      </div>



    </section>

  );


}
