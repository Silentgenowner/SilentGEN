"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";


type Product = {

  _id:string;

  name:string;

  price:number;

  thumbnail?:string;

  images?:string[];

  slug:string;

  category?:string;

};




function SearchPageContent() {
  const searchParams = useSearchParams();



const query =
searchParams.get("q") || "";



const [products,setProducts] =
useState<Product[]>([]);



const [loading,setLoading] =
useState(true);



const [error,setError] =
useState("");






useEffect(()=>{


if(query){

searchProducts();

}
else{

setProducts([]);

setLoading(false);

}


},[query]);








async function searchProducts(){


try{


setLoading(true);

setError("");



const res =
await fetch(

`/api/search?q=${encodeURIComponent(query)}`,

{

cache:"no-store"

}

);





const data =
await res.json();





if(data.success){


setProducts(
data.products || []
);


}
else{


setProducts([]);

setError(
data.message || "No products found"
);


}




}
catch(error){


console.log(
"SEARCH ERROR",
error
);


setError(
"Something went wrong"
);


}
finally{


setLoading(false);


}


}









if(loading){


return(

<div className="
min-h-screen
flex
items-center
justify-center
">

Searching...

</div>

);


}









return(


<main className="
max-w-7xl
mx-auto
px-6
py-10
">






<h1 className="
text-3xl
font-bold
mb-8
">

Search Result For:

{" "}

<span className="text-gray-500">

{query}

</span>


</h1>









{
products.length === 0 &&

<div className="
text-center
py-20
">


<h2 className="
text-2xl
font-bold
">

No Products Found

</h2>



<Link

href="/shop"

className="
inline-block
mt-5
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

}









<div className="
grid
grid-cols-1
sm:grid-cols-2
lg:grid-cols-4
gap-6
">






{

products.map((product)=>(



<div

key={product._id}

className="
border
rounded-xl
p-4
hover:shadow-lg
transition
"

>


<Link

href={`/product/${product.slug}`}

>





<Image

src={

product.thumbnail ||

product.images?.[0] ||

"/images/no-image.png"

}

alt={product.name}

width={300}

height={300}

className="
w-full
h-72
object-cover
rounded-lg
"

/>





<h2 className="
font-bold
text-lg
mt-4
">

{product.name}

</h2>





<p className="
text-gray-600
mt-2
">

₹{product.price}

</p>






</Link>



</div>



))


}





</div>







</main>


);


}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
