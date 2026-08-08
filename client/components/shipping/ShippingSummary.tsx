"use client";


type Props = {

  order:any;

};



export default function ShippingSummary({

  order

}:Props){


  return (

    <div className="border rounded-lg p-5 mb-6">


      <h2 className="text-xl font-bold mb-5">

        Shipping Summary

      </h2>



      <div className="space-y-3">



        <div className="flex justify-between">

          <span>

            Payment Method

          </span>

          <span className="font-semibold">

            {order.paymentMethod}

          </span>

        </div>





        <div className="flex justify-between">

          <span>

            Subtotal

          </span>

          <span className="font-semibold">

            ₹{order.subtotal}

          </span>

        </div>





        <div className="flex justify-between">

          <span>

            Shipping Charge

          </span>

          <span className="font-semibold">

            ₹{order.shippingCharge}

          </span>

        </div>





        <div className="flex justify-between">

          <span>

            Discount

          </span>

          <span className="font-semibold">

            ₹{order.discount}

          </span>

        </div>





        <div className="flex justify-between border-t pt-3">

          <span className="font-bold">

            Total Amount

          </span>

          <span className="font-bold text-xl">

            ₹{order.totalAmount}

          </span>

        </div>



      </div>


    </div>

  );


}
