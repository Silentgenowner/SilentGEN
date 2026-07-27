"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Menu,
  X,
  ShoppingCart,
  Heart,
  Search,
} from "lucide-react";


import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

import LogoutButton from "@/components/LogoutButton/LogoutButton";




export default function Navbar() {


  const router = useRouter();


  const [loading,setLoading] =
  useState(true);


  const [loggedIn,setLoggedIn] =
  useState(false);



  const [userName,setUserName] =
  useState("");



  const [mobileMenu,setMobileMenu] =
  useState(false);



  const [search,setSearch] =
  useState("");





  const {
    totalItems:cartCount,
    loadCart,
  } = useCart();




  const {
    totalItems:wishlistCount,
  } = useWishlist();








  async function checkLogin(){


    try{


      const res =
      await fetch(
        "/api/user/profile",
        {
          cache:"no-store"
        }
      );



      const data =
      await res.json();




      if(data.success){


        setLoggedIn(true);


        setUserName(
          data.user?.name || "User"
        );


        loadCart();


      }
      else{


        setLoggedIn(false);

        setUserName("");

        loadCart();


      }



    }
    catch(error){


      console.log(
        "LOGIN CHECK ERROR",
        error
      );


      setLoggedIn(false);

    }
    finally{


      setLoading(false);


    }


  }








  useEffect(()=>{


    checkLogin();


    window.addEventListener(
      "focus",
      checkLogin
    );



    return()=>{


      window.removeEventListener(
        "focus",
        checkLogin
      );


    };


  },[]);










  function handleSearch(){


    if(!search.trim()){

      return;

    }



    router.push(
      `/search?q=${encodeURIComponent(search)}`
    );


    setMobileMenu(false);


  }

    return (

<header
className="
sticky
top-0
z-50
bg-white/90
backdrop-blur-md
shadow-md
border-b
"
>


<div
className="
max-w-7xl
mx-auto
px-4
"
>


<div
className="
h-16
flex
items-center
justify-between
"
>





<Link

href="/"

className="
text-3xl
font-black
tracking-[0.2em]
"

>

SilentGEN

</Link>








<nav
className="
hidden
lg:flex
items-center
gap-6
"
>





<Link
href="/"
className="
font-medium
hover:text-gray-600
"
>

Home

</Link>





<Link
href="/shop"
className="
font-medium
hover:text-gray-600
"
>

Shop

</Link>









<div
className="
flex
items-center
border
rounded-full
px-4
py-2
w-64
"
>


<input

type="text"

placeholder="Search products..."

value={search}

onChange={(e)=>
setSearch(e.target.value)
}

onKeyDown={(e)=>{

if(e.key==="Enter"){

handleSearch();

}

}}

className="
flex-1
outline-none
text-sm
"

 />



<button
onClick={handleSearch}
>

<Search
size={20}
/>

</button>


</div>









<Link

href="/wishlist"

className="
relative
hover:scale-110
transition
"

>

<Heart
size={23}
/>


{
wishlistCount > 0 &&

<span
className="
absolute
-top-2
-right-2
bg-red-600
text-white
text-xs
rounded-full
h-5
w-5
flex
items-center
justify-center
"
>

{wishlistCount}

</span>

}


</Link>









<Link

href="/cart"

className="
relative
hover:scale-110
transition
"

>


<ShoppingCart
size={23}
/>



{
cartCount > 0 &&

<span
className="
absolute
-top-2
-right-2
bg-black
text-white
text-xs
rounded-full
h-5
w-5
flex
items-center
justify-center
"
>

{cartCount}

</span>

}



</Link>









{
loading ?

(

<span
className="
text-sm
text-gray-500
"
>

Loading...

</span>

)


:


loggedIn ?

(

<div
className="
flex
items-center
gap-4
"
>


<Link

href="/account"

className="
flex
items-center
gap-2
hover:bg-gray-100
px-3
py-2
rounded-full
transition
"

>


<div
className="
w-9
h-9
rounded-full
bg-black
text-white
flex
items-center
justify-center
font-bold
uppercase
"
>

{
userName.charAt(0)
}

</div>



<div
className="
hidden
xl:block
text-sm
font-semibold
"
>

{userName}

</div>


</Link>




<LogoutButton />


</div>

)


:


<Link

href="/login"

className="
bg-black
text-white
px-5
py-2
rounded-full
hover:bg-gray-800
transition
"

>

Login

</Link>


}



</nav>









<button

className="
lg:hidden
"

onClick={()=>setMobileMenu(!mobileMenu)}

>


{
mobileMenu ?

<X size={28}/>

:

<Menu size={28}/>

}


</button>



</div>









{
mobileMenu && (


<div

className="
lg:hidden
border-t
py-5
flex
flex-col
gap-5
"

>





<div

className="
flex
items-center
border
rounded-full
px-4
py-2
"

>


<input

type="text"

placeholder="Search..."

value={search}

onChange={(e)=>
setSearch(e.target.value)
}

onKeyDown={(e)=>{

if(e.key==="Enter"){

handleSearch();

}

}}

className="
flex-1
outline-none
"

 />


<button
onClick={handleSearch}
>

<Search size={20}/>

</button>


</div>






<Link href="/">
Home
</Link>


<Link href="/shop">
Shop
</Link>


<Link href="/wishlist">

Wishlist ({wishlistCount})

</Link>



<Link href="/cart">

Cart ({cartCount})

</Link>






{
loggedIn ?

(

<>


<Link href="/account">

My Account

</Link>


<Link href="/account/profile">

Profile

</Link>


<Link href="/account/orders">

My Orders

</Link>


<Link href="/account/address">

My Address

</Link>


<LogoutButton />


</>


)


:


<Link href="/login">

Login

</Link>


}



</div>


)

}




</div>


</header>

  );

}
