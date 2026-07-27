"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/context/CartContext";


type Props = {
  productId:string;
};


export default function AddToCartButton({
  productId,
}:Props){


  const router = useRouter();


  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart
  } = useCart();



  const [loading,setLoading] =
    useState(false);



  const cartItem =
    cart.find(
      item =>
        item.productId === productId
    );





  async function handleAddToCart(){


    try{


      setLoading(true);


      const success =
        await addToCart(
          productId,
          1,
          "",
          ""
        );



      if(!success){

        router.push("/login");

        return;

      }



    }
    catch(error){

      console.log(error);

    }
    finally{

      setLoading(false);

    }

  }





  async function handleBuyNow(){


    const success =
      await addToCart(
        productId,
        1,
        "",
        ""
      );


    if(!success){

      router.push("/login");

      return;

    }


    router.push("/cart");


  }





  return(

    <div className="space-y-4">


      {
        cartItem
        ?

        <>

          <div className="flex items-center justify-between border rounded-lg p-3">


            <button

              onClick={()=>updateQuantity(
                productId,
                "",
                "",
                "decrease"
              )}

              className="
                w-12
                h-12
                bg-gray-200
                rounded
                text-xl
              "

            >
              -
            </button>



            <span className="text-xl font-bold">

              {cartItem.quantity}

            </span>



            <button

              onClick={()=>updateQuantity(
                productId,
                "",
                "",
                "increase"
              )}

              className="
                w-12
                h-12
                bg-gray-200
                rounded
                text-xl
              "

            >

              +

            </button>


          </div>



          <button

            onClick={()=>removeFromCart(
              productId,
              "",
              ""
            )}

            className="
              w-full
              bg-red-600
              text-white
              py-3
              rounded-lg
            "

          >

            Remove

          </button>


        </>


        :


        <button

          onClick={handleAddToCart}

          disabled={loading}

          className="
            w-full
            bg-black
            text-white
            py-4
            rounded-lg
            hover:bg-gray-800
            disabled:opacity-50
          "

        >

          {
            loading
            ?
            "Adding..."
            :
            "Add To Cart"
          }


        </button>

      }





      <button

        onClick={handleBuyNow}

        className="
          w-full
          border
          border-black
          py-4
          rounded-lg
          hover:bg-black
          hover:text-white
          transition
        "

      >

        Buy Now


      </button>


    </div>

  );

}
