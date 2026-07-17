"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import WishlistButton from "@/components/WishlistButton/WishlistButton";


type ProductProps = {
  id: number;
  name: string;
  price: number;
  image?: string;
};


export default function ProductCard({
  id,
  name,
  price,
  image,
}: ProductProps) {


  const [loading, setLoading] = useState(false);


  const productImage =
    image && image.trim() !== ""
      ? image
      : "/images/no-image.png";



  const handleAddToCart = async () => {

    try {

      setLoading(true);


      const res = await fetch("/api/cart/add", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          productId: id,

          name,

          price,

        }),

      });



      const data = await res.json();



      if (data.success) {

        alert("Product Added To Cart");

      } 
      else {

        alert(data.message);

      }


    } 
    catch (error) {

      console.error(
        "ADD CART ERROR:",
        error
      );

      alert(
        "Something went wrong"
      );

    } 
    finally {

      setLoading(false);

    }

  };



  return (

    <div className="relative bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">


      {/* Product Image */}

      <Link href={`/product/${id}`}>

        <Image

          src={productImage}

          alt={name}

          width={500}

          height={500}

          className="w-full h-72 object-cover"

        />

      </Link>



      <div className="p-4">



        {/* Wishlist */}

        <div className="flex justify-end mb-3">


          <WishlistButton

            id={id}

            name={name}

            price={price}

            image={productImage}

          />


        </div>




        {/* Product Name */}

        <Link href={`/product/${id}`}>

          <h2 className="text-xl font-semibold hover:text-blue-600 transition">

            {name}

          </h2>


        </Link>




        {/* Price */}

        <p className="text-gray-600 mt-2 text-lg">

          ₹{price}

        </p>





        {/* Add Cart Button */}

        <button


          onClick={handleAddToCart}


          disabled={loading}


          className="w-full mt-5 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"


        >


          {loading
            ? "Adding..."
            : "Add To Cart"
          }


        </button>



      </div>


    </div>

  );

}
