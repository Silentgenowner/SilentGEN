"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";



export type CartProduct = {

  _id:string;

  name?:string;

  image?:string;

  price?:number;

};



export type CartItem = {

  _id?:string;

  productId?: string | CartProduct;

  product?: CartProduct;

  name:string;

  image:string;

  price:number;

  quantity:number;

  size:string;

  color:string;

};




type CartContextType = {


  cart:CartItem[];

  loading:boolean;

  totalItems:number;

  totalPrice:number;


  loadCart:()=>Promise<void>;


  addToCart:
  (
    productId:string,
    quantity?:number,
    size?:string,
    color?:string
  )
  =>Promise<boolean>;



  updateQuantity:
  (
    productId:string,
    size:string,
    color:string,
    action:"increase"|"decrease"
  )
  =>Promise<void>;



  removeFromCart:
  (
    productId:string,
    size:string,
    color:string
  )
  =>Promise<void>;



  clearCart:()=>void;


};





const CartContext =
createContext<CartContextType | null>(null);






export function CartProvider({

  children,

}:{

  children:ReactNode;

}){



const [cart,setCart] =
useState<CartItem[]>([]);



const [loading,setLoading] =
useState(true);








async function loadCart(){


try{


const res =
await fetch(
"/api/cart/list",
{
cache:"no-store"
}
);



const data =
await res.json();





if(data.success){



const formattedCart =
(data.items || []).map(
(item:any)=>{
  const prodId = item.productId?._id || item.productId || "";
  const prodIdStr = typeof prodId === "object" ? prodId.toString() : prodId;
  return {
    ...item,
    productId: prodIdStr,
    name: item.name || item.productId?.name || "",
    image: item.image || item.productId?.thumbnail || item.productId?.image || "/images/no-image.png",
    price: item.price || item.productId?.price || 0,
    quantity: item.quantity || 1,
    size: item.size || "",
    color: item.color || ""
  };
});




setCart(formattedCart);



}
else{


setCart([]);


}



}
catch(error){


console.log(error);

setCart([]);


}
finally{


setLoading(false);


}



}








useEffect(()=>{


loadCart();


},[]);









async function addToCart(

productId:string,

quantity=1,

size="",

color=""

):Promise<boolean>{



try{



const res =
await fetch(

"/api/cart/add",

{


method:"POST",


headers:{


"Content-Type":
"application/json"


},



body:JSON.stringify({

productId,

quantity,

size,

color

})


}

);





if(res.status===401){


return false;


}





const data =
await res.json();





if(!data.success){


alert(data.message);


return false;


}




await loadCart();



return true;



}
catch(error){


console.log(error);


return false;


}



}









async function updateQuantity(

productId:string,

size:string,

color:string,

action:"increase"|"decrease"

){



try{



const res =
await fetch(

"/api/cart/update",

{


method:"PATCH",


headers:{


"Content-Type":
"application/json"


},



body:JSON.stringify({


productId,

size,

color,

action


})


}

);





const data =
await res.json();





if(data.success){


await loadCart();


}
else{


alert(data.message);


}



}
catch(error){


console.log(error);


}



}









async function removeFromCart(

productId:string,

size:string,

color:string

){



try{



const res =
await fetch(

"/api/cart/remove",

{


method:"DELETE",


headers:{


"Content-Type":
"application/json"


},



body:JSON.stringify({


productId,

size,

color


})


}

);





const data =
await res.json();





if(data.success){


await loadCart();


}
else{


alert(data.message);


}



}
catch(error){


console.log(error);


}



}









function clearCart(){


setCart([]);


}









const totalItems =
useMemo(()=>{


return cart.reduce(

(total,item)=>

total + item.quantity,

0

);



},[cart]);









const totalPrice =
useMemo(()=>{


return cart.reduce(

(total,item)=>

total +

(item.price || 0) *

item.quantity,

0

);



},[cart]);









return(


<CartContext.Provider


value={{


cart,

loading,

totalItems,

totalPrice,

loadCart,

addToCart,

updateQuantity,

removeFromCart,

clearCart


}}


>


{children}


</CartContext.Provider>


);



}









export function useCart(){



const context =
useContext(CartContext);





if(!context){


throw new Error(

"useCart must be used inside CartProvider"

);


}





return context;



}
