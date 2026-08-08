"use client";


type Props = {

  items:any[];

};


export default function InvoiceItems({

  items

}:Props){


  return (

    <div className="mb-8">


      <h2 className="text-xl font-bold mb-4">

        Product Details

      </h2>


      {

        items.map((item,index)=>(

          <div

            key={index}

            className="
            flex
            justify-between
            border-b
            py-3
            "

          >

            <div>

              <p className="font-semibold">

                {item.name}

              </p>


              {

                item.size &&

                <p>

                  Size: {item.size}

                </p>

              }


              {

                item.color &&

                <p>

                  Color: {item.color}

                </p>

              }


              <p>

                Qty: {item.quantity}

              </p>


            </div>


            <div>

              ₹{item.price * item.quantity}

            </div>


          </div>

        ))

      }


    </div>

  );


}
