"use client";


type Props = {

  items:any[];

};



export default function ShippingItems({

  items

}:Props){


  return (

    <div className="border rounded-lg p-5 mb-6">


      <h2 className="text-xl font-bold mb-5">

        Product Details

      </h2>



      <div className="space-y-4">


        {

          items.map((item,index)=>(


            <div

              key={index}

              className="
              flex
              justify-between
              border-b
              pb-4
              last:border-none
              "

            >



              <div>


                <p className="font-semibold text-lg">

                  {item.name}

                </p>



                {

                  item.size &&

                  <p className="text-sm">

                    Size:

                    {" "}

                    {item.size}

                  </p>

                }



                {

                  item.color &&

                  <p className="text-sm">

                    Color:

                    {" "}

                    {item.color}

                  </p>

                }



                <p className="text-sm">

                  Quantity:

                  {" "}

                  {item.quantity}

                </p>


              </div>





              <div className="font-semibold">


                ₹

                {

                  item.price *

                  item.quantity

                }


              </div>




            </div>


          ))

        }


      </div>



    </div>

  );


}
