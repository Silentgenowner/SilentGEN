"use client";

import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import Image from "next/image";
import Link from "next/link";

import { useWishlist } from "@/context/WishlistContext";


export default function WishlistPage() {

  const {
    wishlist,
    removeFromWishlist,
  } = useWishlist();


  return (

    <>
      <Navbar />


      <main className="max-w-7xl mx-auto px-6 py-10">


        <h1 className="text-4xl font-bold mb-8">
          ❤️ My Wishlist
        </h1>



        {wishlist.length === 0 ? (

          <div className="text-center mt-20">


            <h2 className="text-2xl font-semibold">
              Your Wishlist is Empty
            </h2>



            <Link

              href="/shop"

              className="
              inline-block
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


          </div>


        ) : (


          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            lg:grid-cols-4
            gap-6
          ">


            {wishlist.map((product) => (


              <div

                key={product.id}

                className="
                border
                rounded-xl
                p-4
                shadow
                "

              >


                <Image

                  src={product.image}

                  alt={product.name}

                  width={300}

                  height={300}

                  className="
                  w-full
                  h-60
                  object-cover
                  rounded-lg
                  "

                />



                <h2 className="text-xl font-semibold mt-4">

                  {product.name}

                </h2>



                <p className="text-gray-600 mt-2">

                  ₹{product.price}

                </p>



                <button

                  onClick={() =>
                    removeFromWishlist(product.id)
                  }

                  className="
                  mt-4
                  w-full
                  bg-red-600
                  text-white
                  py-2
                  rounded-lg
                  hover:bg-red-700
                  "

                >

                  Remove

                </button>


              </div>


            ))}


          </div>


        )}


      </main>


      <Footer />

    </>

  );
}
