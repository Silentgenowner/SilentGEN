"use client";


type Props = {

  order:any;

};



export default function ShippingCustomer({

  order

}:Props){


  const address = order.shippingAddress;



  return (

    <div className="border rounded-lg p-5 mb-6">


      <h2 className="text-xl font-bold mb-4">

        Shipping Address

      </h2>



      <p className="font-semibold">

        {address.fullName}

      </p>



      <p>

        Mobile:

        {" "}

        {address.mobile}

      </p>



      <p className="mt-2">

        {address.address}

      </p>



      <p>

        {address.area}

      </p>



      <p>

        {address.city},

        {" "}

        {address.state}

      </p>



      <p>

        {address.country}

        {" - "}

        {address.pincode}

      </p>



      {

        address.landmark &&

        <p className="mt-2">

          Landmark:

          {" "}

          {address.landmark}

        </p>

      }



    </div>

  );


}
