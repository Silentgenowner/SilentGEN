"use client";


type Props = {

  orderId:string;

  subtotal:number;

  shippingCharge:number;

  discount:number;

  totalAmount:number;

};



export default function InvoiceSummary({

  subtotal,

  shippingCharge,

  discount,

  totalAmount

}:Props){


  return (

    <section

      className="
      border
      rounded-lg
      p-6
      mb-8
      "

    >


      <h2

        className="
        text-xl
        font-bold
        mb-5
        "

      >

        Payment Summary

      </h2>



      <div

        className="
        space-y-3
        "

      >


        <div

          className="
          flex
          justify-between
          "

        >

          <span>

            Subtotal

          </span>


          <span>

            ₹{subtotal}

          </span>


        </div>





        <div

          className="
          flex
          justify-between
          "

        >

          <span>

            Shipping Charge

          </span>


          <span>

            ₹{shippingCharge}

          </span>


        </div>





        <div

          className="
          flex
          justify-between
          "

        >

          <span>

            Discount

          </span>


          <span>

            - ₹{discount}

          </span>


        </div>





        <hr />





        <div

          className="
          flex
          justify-between
          text-xl
          font-bold
          "

        >

          <span>

            Total

          </span>


          <span>

            ₹{totalAmount}

          </span>


        </div>



      </div>



    </section>


  );


}
