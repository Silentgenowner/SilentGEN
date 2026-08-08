"use client";


type Props = {

  order:any;

};



export default function InvoiceHeader({

  order

}:Props){


  return (

    <section

      className="
      border-b
      pb-6
      mb-6
      "

    >

      <div

        className="
        flex
        justify-between
        "

      >

        <div>


          <h1

            className="
            text-3xl
            font-bold
            "

          >

            SilentGEN

          </h1>


          <p className="text-gray-500">

            Fashion & Lifestyle Store

          </p>


        </div>



        <div className="text-right">


          <h2 className="text-xl font-bold">

            INVOICE

          </h2>


          <p>

            Order ID:

            {" "}

            {order._id}

          </p>


          <p>

            Date:

            {" "}

            {

              new Date(

                order.createdAt

              ).toLocaleDateString()

            }

          </p>


        </div>


      </div>


    </section>

  );


}
