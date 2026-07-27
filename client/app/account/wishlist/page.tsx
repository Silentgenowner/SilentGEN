"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  _id: string;
  name: string;
  price: number;
  thumbnail?: string;
};


export default function WishlistPage() {

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {

    fetchWishlist();

  }, []);



  async function fetchWishlist() {

    try {

      const res = await fetch(
        "/api/wishlist",
        {
          cache: "no-store",
        }
      );


      const data = await res.json();


      if(data.success){

        setProducts(
          data.products || []
        );

      }


    } catch(error){

      console.log(
        "WISHLIST ERROR",
        error
      );

    } finally {

      setLoading(false);

    }

  }




  if(loading){

    return (
      <div className="text-center py-10">
        Loading Wishlist...
      </div>
    );

  }




  return (

    <div className="max-w-6xl mx-auto px-6 py-10">


      <h1 className="text-3xl font-bold mb-8">
        My Wishlist
      </h1>



      {
        products.length === 0 ? (

          <div className="border rounded-xl p-10 text-center">

            <p className="text-gray-500 mb-5">
              Your wishlist is empty
            </p>


            <Link
              href="/shop"
              className="bg-black text-white px-6 py-3 rounded-lg"
            >
              Continue Shopping
            </Link>


          </div>


        ) : (


          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">


            {
              products.map((product)=>(


                <Link
                  key={product._id}
                  href={`/product/${product._id}`}
                  className="border rounded-xl p-4 hover:shadow-lg transition"
                >


                  {
                    product.thumbnail && (

                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-full h-56 object-cover rounded-lg"
                      />

                    )
                  }



                  <h2 className="font-semibold mt-4">
                    {product.name}
                  </h2>


                  <p className="mt-2 font-bold">
                    ₹ {product.price}
                  </p>


                </Link>


              ))
            }


          </div>


        )
      }



    </div>

  );

}
