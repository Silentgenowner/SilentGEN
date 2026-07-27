"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import WishlistButton from "@/components/WishlistButton/WishlistButton";
import { useCart } from "@/context/CartContext";


type Props = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  image: string;
  category: string;
  discount?: number;
  rating?: number;
  sizes?: string[];
  colors?: string[];
};



export default function ProductCard({
  id,
  name,
  slug,
  price,
  mrp,
  image,
  category,
  discount,
  rating = 0,
  sizes = [],
  colors = [],
}: Props) {


  const router = useRouter();


  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
  } = useCart();



  const [adding, setAdding] = useState(false);



  function getProductId(productId: any) {

    if (typeof productId === "string") {
      return productId;
    }


    if (productId?._id) {
      return productId._id;
    }


    return "";

  }



  const cartItem = cart.find((item: any) => {

    return getProductId(item.productId) === id;

  });



  const productImage =
    image && image.trim() !== ""
      ? image
      : "/images/no-image.png";





  async function handleAddCart() {


    try {

      setAdding(true);


      const success = await addToCart(
        id,
        1,
        "",
        ""
      );


      if (!success) {

        router.push("/login");

      }


    }
    finally {

      setAdding(false);

    }

  }





  return (

    <div
      className="
      bg-white
      rounded-xl
      shadow
      overflow-hidden
      hover:shadow-xl
      transition
      relative
      "
    >



      <WishlistButton

        id={id}

        name={name}

        slug={slug}

        image={productImage}

        price={price}

        mrp={mrp}

      />





      <Link href={`/product/${id}`}>

        <div
          className="
          h-72
          w-full
          relative
          "
        >

          <Image

            src={productImage}

            alt={name}

            fill

          sizes="(max-width: 768px) 100vw, 
          (max-width: 1200px) 50vw, 25vw"

            className="object-cover"

          />


        </div>


      </Link>





      <div className="p-5">


        <p className="text-sm text-gray-500">

          {category}

        </p>




        <Link href={`/product/${id}`}>

          <h2
            className="
            text-xl
            font-semibold
            mt-2
            "
          >

            {name}

          </h2>

        </Link>





        <div
          className="
          flex
          items-center
          gap-3
          mt-3
          "
        >

          <span className="text-xl font-bold">

            ₹{price}

          </span>


          <span
            className="
            text-gray-400
            line-through
            "
          >

            ₹{mrp}

          </span>


        </div>





        {
          discount &&
          discount > 0 &&

          <p
            className="
            text-green-600
            text-sm
            mt-2
            "
          >

            {discount}% OFF

          </p>

        }








        {
          cartItem

          ?

          <div className="mt-5 space-y-3">


            <div
              className="
              flex
              items-center
              justify-between
              border
              rounded-lg
              p-2
              "
            >


              <button

                onClick={() =>
                  updateQuantity(
                    id,
                    "",
                    "",
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





              <span
                className="
                text-xl
                font-bold
                "
              >

                {cartItem.quantity}

              </span>





              <button

                onClick={() =>
                  updateQuantity(
                    id,
                    "",
                    "",
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

              onClick={() =>
                removeFromCart(
                  id,
                  "",
                  ""
                )
              }


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


          </div>


          :


          <button

            onClick={handleAddCart}

            disabled={adding}


            className="
            mt-5
            w-full
            bg-black
            text-white
            py-3
            rounded-lg
            hover:bg-gray-800
            transition
            disabled:opacity-50
            "
          >

            {
              adding
              ? 
              "Adding..."
              :
              "Add To Cart"
            }


          </button>


        }



      </div>



    </div>

  );

}
