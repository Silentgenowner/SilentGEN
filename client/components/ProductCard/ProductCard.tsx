"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import WishlistButton from "@/components/WishlistButton/WishlistButton";
import { useCart } from "@/context/CartContext";



type Props = {

  id:string;

  name:string;

  slug:string;

  price:number;

  mrp:number;

  image:string;

  category:string;

  discount?:number;

  rating?:number;

  stock?:number;

  sizes?:string[];

  colors?:string[];

};





export default function ProductCard({

  id,

  name,

  slug,

  price,

  mrp,

  image,

  category,

  discount = 0,

  rating = 0,

  stock = 0,

  sizes = [],

  colors = [],


}:Props){



const router = useRouter();



const {

  cart,

  addToCart,

  updateQuantity,

  removeFromCart,

}=useCart();





const [adding,setAdding] =
useState(false);



const [selectedSize,setSelectedSize] =
useState("");



const [selectedColor,setSelectedColor] =
useState("");






const productImage =

image && image.trim() !== ""

?

image

:

"/images/no-image.png";






function getProductId(productId:any){


if(typeof productId === "string"){

return productId;

}


if(productId?._id){

return productId._id;

}


return "";

}




const cartItem =

cart.find((item:any)=>

getProductId(item.productId) === id &&

(item.size || "") === selectedSize &&

(item.color || "") === selectedColor

);






const isOutOfStock =

stock <= 0;



const isLowStock =

stock > 0 && stock <= 5;



// ==============================
// ADD TO CART
// ==============================


async function handleAddCart(){


  if(
    sizes.length > 0 &&
    !selectedSize
  ){

    alert(
      "Please select size"
    );

    return;

  }




  if(
    colors.length > 0 &&
    !selectedColor
  ){

    alert(
      "Please select color"
    );

    return;

  }





  if(isOutOfStock){

    alert(
      "Product is out of stock"
    );

    return;

  }






  try{


    setAdding(true);




    const success =

    await addToCart(

      id,

      1,

      selectedSize,

      selectedColor

    );





    if(!success){

      router.push("/login");

    }





  }
  catch(error){

    console.log(
      "ADD CART ERROR",
      error
    );

  }
  finally{


    setAdding(false);


  }



}







// ==============================
// STOCK DISPLAY
// ==============================


function StockStatus(){


  if(stock <= 0){


    return (

      <span
      className="
      text-xs
      px-3
      py-1
      rounded-full
      bg-red-100
      text-red-600
      font-semibold
      "
      >

      Out Of Stock

      </span>

    );


  }





  if(isLowStock){


    return (

      <span
      className="
      text-xs
      px-3
      py-1
      rounded-full
      bg-orange-100
      text-orange-600
      font-semibold
      "
      >

      Only {stock} Left

      </span>

    );


  }





  return (

    <span
    className="
    text-xs
    px-3
    py-1
    rounded-full
    bg-green-100
    text-green-600
    font-semibold
    "
    >

    In Stock

    </span>

  );


}







// ==============================
// RATING
// ==============================


function ProductRating(){


return (

<div
className="
flex
items-center
gap-1
"
>


{

[1,2,3,4,5].map((star)=>(


<span

key={star}

className={

star <= Math.round(rating)

?

"text-yellow-500"

:

"text-gray-300"

}

>

★

</span>


))


}



<span
className="
text-xs
text-gray-500
ml-1
"
>

{rating.toFixed(1)}

</span>



</div>


);


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



{/* ======================
    WISHLIST BUTTON
====================== */}


<WishlistButton

id={id}

name={name}

slug={slug}

image={productImage}

price={price}

mrp={mrp}

/>







{/* ======================
    IMAGE
====================== */}


<Link href={`/product/${id}`}>

<div
className="
relative
w-full
h-72
"
>


<Image

src={productImage}

alt={name}

fill

sizes="
(max-width:768px) 100vw,
(max-width:1200px) 50vw,
25vw
"

className="
object-cover
"

/>


</div>


</Link>







<div className="p-5">






{/* CATEGORY + STOCK */}


<div
className="
flex
justify-between
items-center
"
>


<p
className="
text-sm
text-gray-500
"
>

{category}

</p>



<StockStatus />



</div>








<Link href={`/product/${id}`}>

<h2
className="
text-xl
font-semibold
mt-3
"
>

{name}

</h2>


</Link>







{/* RATING */}


<div className="mt-2">

<ProductRating />

</div>








{/* PRICE */}


<div
className="
flex
items-center
gap-3
mt-4
"
>


<span
className="
text-xl
font-bold
"
>

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








{/* DISCOUNT */}


{

discount > 0 &&


<p
className="
text-green-600
font-semibold
text-sm
mt-2
"
>

{discount}% OFF

</p>


}







{/* ======================
      SIZE SELECT
====================== */}



{

sizes.length > 0 &&


<div
className="
mt-5
"
>


<p
className="
text-sm
font-semibold
mb-2
"
>

Select Size

</p>





<div
className="
flex
gap-2
flex-wrap
"
>


{

sizes.map((size)=>(


<button

key={size}

onClick={()=>setSelectedSize(size)}


className={

`
px-3
py-1
border
rounded

${
selectedSize === size

?

"bg-black text-white"

:

"bg-white"

}

`

}

>

{size}

</button>


))


}



</div>


</div>


}

{/* ======================
      COLOR SELECT
====================== */}



{

colors.length > 0 &&


<div
className="
mt-5
"
>


<p
className="
text-sm
font-semibold
mb-2
"
>

Select Color

</p>





<div
className="
flex
gap-2
flex-wrap
"
>



{

colors.map((color)=>(


<button

key={color}

onClick={()=>
setSelectedColor(color)
}


className={

`
px-3
py-1
border
rounded

${
selectedColor === color

?

"bg-black text-white"

:

"bg-white"

}

`

}

>

{color}

</button>


))


}



</div>


</div>


}








{/* ======================
      CART ACTION
====================== */}



{

cartItem ?



<div
className="
mt-5
space-y-3
"
>





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

onClick={()=>


updateQuantity(

id,

selectedSize,

selectedColor,

"decrease"

)


}


className="
w-10
h-10
rounded
bg-gray-200
text-xl
"

>

-

</button>







<span
className="
font-bold
text-xl
"
>

{cartItem.quantity}

</span>







<button

onClick={()=>


updateQuantity(

id,

selectedSize,

selectedColor,

"increase"

)


}


className="
w-10
h-10
rounded
bg-gray-200
text-xl
"

>

+

</button>




</div>







<button

onClick={()=>


removeFromCart(

id,

selectedSize,

selectedColor

)


}


className="
w-full
py-3
rounded-lg
bg-red-600
text-white
"

>

Remove

</button>





</div>





:





<button

onClick={handleAddCart}

disabled={
  adding ||
  isOutOfStock
}


className="
mt-5
w-full
py-3
rounded-lg
bg-black
text-white
hover:bg-gray-800
disabled:opacity-50
"

>


{
adding

?

"Adding..."

:

isOutOfStock

?

"Out Of Stock"

:

"Add To Cart"

}


</button>



}

</div>


</div>


);

}