"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";


type Address = {

_id:string;

fullName?:string;

name?:string;

mobile?:string;

phone?:string;

address:string;

area?:string;

city:string;

state:string;

country?:string;

pincode:string;

landmark?:string;

isDefault?:boolean;

};



export default function CheckoutPage(){


const router = useRouter();
const { clearCart } = useCart();



const [addresses,setAddresses] =
useState<Address[]>([]);



const [selectedAddress,setSelectedAddress] =
useState<Address | null>(null);



const [paymentMethod,setPaymentMethod] =
useState("COD");



const [loading,setLoading] =
useState(true);



const [placing,setPlacing] =
useState(false);



const [message,setMessage] =
useState("");





// =========================
// LOAD ADDRESS
// =========================

async function loadAddresses(){


try{


const res =
await fetch(
"/api/address",
{
cache:"no-store"
}
);



const data =
await res.json();



console.log(
"ADDRESS RESPONSE:",
data
);




if(data.success){


const list =
data.addresses || [];



setAddresses(list);





if(list.length > 0){


const defaultAddress =
list.find(
(item:Address)=>
item.isDefault === true
);



setSelectedAddress(
defaultAddress || list[0]
);



}



}



}
catch(error){


console.log(
"ADDRESS LOAD ERROR",
error
);


}
finally{


setLoading(false);


}


}





useEffect(()=>{


loadAddresses();


},[]);





// =========================
// PLACE ORDER
// =========================


async function placeOrder(){



if(!selectedAddress){


setMessage(
"Please select address"
);


return;


}



try{


setPlacing(true);




const orderAddress = {

fullName:
selectedAddress.fullName ||
(selectedAddress as any).name ||
"Customer",


mobile:
selectedAddress.mobile ||
(selectedAddress as any).phone ||
"",


address:
selectedAddress.address || "",


area:
selectedAddress.area ||
(selectedAddress as any).locality ||
(selectedAddress as any).street ||
"NA",


city:
selectedAddress.city || "",


state:
selectedAddress.state || "",


country:
selectedAddress.country || "India",


pincode:
selectedAddress.pincode || "",


landmark:
selectedAddress.landmark || ""

};





const res =
await fetch(

"/api/order/place",

{

method:"POST",


headers:{


"Content-Type":
"application/json"

},


body:JSON.stringify({

shippingAddress:
orderAddress,


paymentMethod


})


}

);





const data =
await res.json();



console.log(
"ORDER RESPONSE:",
data
);



if(data.success){


setMessage(
"Order placed successfully"
);



setTimeout(()=>{


router.push(
"/account/orders"
);


},1000);



}
else{


setMessage(
data.message || "Order failed"
);


}



}
catch(error){


console.log(
"PLACE ORDER ERROR",
error
);


setMessage(
"Something went wrong"
);


}
finally{


setPlacing(false);


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

        Loading Checkout...

      </div>

    );

  }




  return(

    <main className="
    max-w-5xl
    mx-auto
    px-6
    py-10
    ">


      <h1 className="
      text-4xl
      font-bold
      mb-8
      ">

        Checkout

      </h1>





      {/* =========================
          ADDRESS SECTION
      ========================== */}


      <section className="
      bg-white
      shadow
      rounded-xl
      p-6
      mb-8
      ">



        <div className="
        flex
        justify-between
        items-center
        mb-5
        ">


          <h2 className="
          text-2xl
          font-bold
          ">

            Delivery Address

          </h2>



          <button

          onClick={()=>router.push(
            "/account/address"
          )}

          className="
          bg-black
          text-white
          px-4
          py-2
          rounded-lg
          "

          >

            + Add Address

          </button>



        </div>






        {
          addresses.length === 0 &&

          <div className="
          border
          rounded-lg
          p-5
          text-center
          ">

            No address found.
            Please add address.

          </div>

        }






        <div className="space-y-4">


        {
          addresses.map((item)=>(


            <label

            key={item._id}

            className="
            block
            border
            rounded-xl
            p-5
            cursor-pointer
            "

            >


              <div className="
              flex
              gap-4
              ">


                <input

                type="radio"

                checked={
                  selectedAddress?._id === item._id
                }

                onChange={()=>{

                  setSelectedAddress(item);

                }}

                />





                <div>


                  <h3 className="
                  font-bold
                  text-lg
                  ">

                    {item.fullName}

                  </h3>




                  {
                    item.isDefault &&

                    <span className="
                    inline-block
                    bg-green-100
                    text-green-700
                    px-3
                    py-1
                    rounded-full
                    text-sm
                    mt-2
                    ">

                      Default Address

                    </span>

                  }






                  <p className="mt-2">

                    {item.mobile}

                  </p>




                  <p>

                    {item.address}

                  </p>




                  {
                    item.area &&

                    <p>

                      {item.area}

                    </p>

                  }





                  <p>

                    {item.city},
                    {" "}
                    {item.state}

                  </p>




                  <p>

                    {item.country || "India"}
                    {" - "}
                    {item.pincode}

                  </p>





                  {
                    item.landmark &&

                    <p>

                      Landmark:
                      {" "}
                      {item.landmark}

                    </p>

                  }




                </div>



              </div>


            </label>


          ))

        }


        </div>



      </section>









      {/* =========================
          PAYMENT SECTION
      ========================== */}



      <section className="
      bg-white
      shadow
      rounded-xl
      p-6
      ">



        <h2 className="
        text-2xl
        font-bold
        mb-5
        ">

          Payment Method

        </h2>






        <label className="
        flex
        gap-3
        mb-4
        ">


          <input

          type="radio"

          checked={
            paymentMethod==="COD"
          }

          onChange={()=>setPaymentMethod("COD")}

          />


          <span>

            Cash On Delivery

          </span>


        </label>







        <label className="
        flex
        gap-3
        ">


          <input

          type="radio"

          checked={
            paymentMethod==="ONLINE"
          }

          onChange={()=>setPaymentMethod("ONLINE")}

          />


          <span>

            Online Payment

          </span>


        </label>







        <button

        onClick={placeOrder}

        disabled={placing}

        className="
        w-full
        mt-8
        bg-black
        text-white
        py-4
        rounded-xl
        text-lg
        disabled:opacity-50
        "

        >


          {
            placing

            ?

            "Placing Order..."

            :

            "Place Order"

          }


        </button>







        {
          message &&

          <p className="
          text-center
          mt-5
          font-bold
          ">

            {message}

          </p>

        }





      </section>



    </main>


  );


}
