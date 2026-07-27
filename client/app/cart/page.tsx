"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";



export default function CartPage() {


  const router = useRouter();


  const {
    cart,
    loading,
    updateQuantity,
    removeFromCart
  } = useCart();




  function getProductId(productId:any):string {


    if(typeof productId === "string"){

      return productId;

    }


    if(productId?._id){

      return productId._id;

    }


    return "";

  }






  const total =
    cart.reduce(

      (sum,item)=>

        sum +

        (item.price || 0) *

        item.quantity,

      0

    );







  if(loading){


    return (

      <div className="
      min-h-screen
      flex
      items-center
      justify-center
      ">

        Loading...

      </div>

    );


  }







  if(cart.length===0){


    return (

      <main className="
      min-h-screen
      flex
      flex-col
      items-center
      justify-center
      ">


        <h1 className="
        text-3xl
        font-bold
        ">

          Your Cart is Empty

        </h1>




        <Link

          href="/shop"

          className="
          mt-6
          bg-black
          text-white
          px-6
          py-3
          rounded-lg
          "

        >

          Continue Shopping

        </Link>


      </main>


    );


  }








  return (

    <main className="
    max-w-7xl
    mx-auto
    px-6
    py-10
    ">



      <h1 className="
      text-4xl
      font-bold
      mb-10
      ">

        Shopping Cart

      </h1>







      <div className="space-y-6">



        {
          cart.map((item,index)=>{


            const productId =
              getProductId(
                item.productId
              );




            return (


              <div

                key={index}

                className="
                bg-white
                rounded-xl
                shadow
                p-5
                flex
                flex-col
                md:flex-row
                items-center
                gap-6
                "

              >




                <Link

                  href={`/product/${productId}`}

                >



                  <Image

                    src={
                      item.image ||
                      "/images/no-image.png"
                    }

                    alt={
                      item.name ||
                      "Product"
                    }

                    width={140}

                    height={140}

                    className="
                    rounded-lg
                    object-cover
                    "

                  />


                </Link>







                <div className="flex-1">


                  <h2 className="
                  text-2xl
                  font-semibold
                  ">

                    {item.name}

                  </h2>




                  <p className="
                  text-2xl
                  font-bold
                  mt-3
                  ">

                    ₹{item.price}

                  </p>






                  {
                    item.size &&

                    <p className="mt-2">

                      <b>Size:</b> {item.size}

                    </p>

                  }






                  {
                    item.color &&

                    <p>

                      <b>Color:</b> {item.color}

                    </p>

                  }




                </div>









                <div className="
                flex
                flex-col
                items-center
                gap-4
                ">



                  <div className="
                  flex
                  items-center
                  gap-3
                  ">



                    <button

                      onClick={()=>


                        updateQuantity(

                          productId,

                          item.size || "",

                          item.color || "",

                          "decrease"

                        )


                      }


                      className="
                      w-10
                      h-10
                      bg-gray-200
                      rounded
                      text-xl
                      "

                    >

                      -

                    </button>






                    <span className="
                    text-xl
                    font-bold
                    ">

                      {item.quantity}

                    </span>






                    <button


                      onClick={()=>


                        updateQuantity(

                          productId,

                          item.size || "",

                          item.color || "",

                          "increase"

                        )


                      }



                      className="
                      w-10
                      h-10
                      bg-gray-200
                      rounded
                      text-xl
                      "

                    >

                      +

                    </button>




                  </div>









                  <button


                    onClick={()=>


                      removeFromCart(

                        productId,

                        item.size || "",

                        item.color || ""

                      )


                    }



                    className="
                    bg-red-600
                    text-white
                    px-5
                    py-2
                    rounded
                    "

                  >

                    Remove

                  </button>




                </div>





              </div>



            );


          })
        }









        <div className="
        bg-white
        rounded-xl
        shadow
        p-6
        ">




          <div className="
          flex
          justify-between
          ">



            <h2 className="
            text-3xl
            font-bold
            ">

              Total

            </h2>





            <span className="
            text-3xl
            font-bold
            ">

              ₹{total}

            </span>




          </div>







          <button


            onClick={()=>router.push("/checkout")}


            className="
            w-full
            mt-6
            bg-black
            text-white
            py-4
            rounded-lg
            "

          >

            Proceed To Checkout


          </button>





        </div>





      </div>





    </main>


  );


}
