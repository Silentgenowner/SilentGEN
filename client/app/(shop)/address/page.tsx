"use client";

import { useEffect, useState } from "react";



type Address = {

_id:string;

fullName:string;

mobile:string;

address:string;

area:string;

city:string;

state:string;

country:string;

pincode:string;

landmark?:string;

};







export default function AddressPage(){



const [addresses,setAddresses] =
useState<Address[]>([]);



const [loading,setLoading] =
useState(true);





const [form,setForm] =
useState({

fullName:"",

mobile:"",

address:"",

area:"",

city:"",

state:"",

country:"India",

pincode:"",

landmark:""

});





const [message,setMessage] =
useState("");






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




if(data.success){

setAddresses(
data.addresses || []
);

}



}
catch(error){


console.log(error);


}
finally{


setLoading(false);


}


}







useEffect(()=>{


loadAddresses();


},[]);









function handleChange(

e:React.ChangeEvent<HTMLInputElement>

){


setForm({

...form,

[e.target.name]:

e.target.value

});


}









async function addAddress(){


try{


const res =
await fetch(

"/api/address",

{


method:"POST",


headers:{


"Content-Type":
"application/json"


},



body:JSON.stringify(form)



}

);



const data =
await res.json();





if(data.success){


setMessage(
"Address added successfully"
);


setForm({

fullName:"",

mobile:"",

address:"",

area:"",

city:"",

state:"",

country:"India",

pincode:"",

landmark:""

});


loadAddresses();


}
else{


setMessage(
data.message
);


}



}
catch(error){


console.log(error);


}



}









async function deleteAddress(id:string){



const res =
await fetch(

`/api/address/${id}`,

{

method:"DELETE"

}

);



const data =
await res.json();



if(data.success){


loadAddresses();


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

Loading...


</div>

);


}







return(


<main className="
max-w-6xl
mx-auto
px-6
py-10
">





<h1 className="
text-4xl
font-bold
mb-8
">

My Addresses

</h1>








<div className="
bg-white
shadow
rounded-xl
p-6
mb-10
">


<h2 className="
text-2xl
font-bold
mb-5
">

Add New Address

</h2>







<div className="
grid
md:grid-cols-2
gap-4
">



{

Object.keys(form).map((key)=>(


<input

key={key}

name={key}

value={(form as any)[key]}

onChange={handleChange}

placeholder={key}

className="
border
rounded-lg
p-3
"

/>


))


}





</div>






<button

onClick={addAddress}

className="
mt-5
bg-black
text-white
px-6
py-3
rounded-lg
"

>

Save Address

</button>





{

message &&

<p className="
mt-3
font-semibold
">

{message}

</p>


}




</div>









<div className="
space-y-5
">



{

addresses.map((item)=>(



<div

key={item._id}

className="
bg-white
shadow
rounded-xl
p-6
"

>



<h2 className="
text-xl
font-bold
">

{item.fullName}

</h2>




<p>

{item.mobile}

</p>




<p className="mt-3">

{item.address}

</p>



<p>

{item.area}

</p>




<p>

{item.city},

{item.state}

</p>




<p>

{item.country}

-

{item.pincode}

</p>





{

item.landmark &&

<p>

Landmark:
{item.landmark}

</p>

}




<button

onClick={()=>
deleteAddress(item._id)
}

className="
mt-5
bg-red-600
text-white
px-5
py-2
rounded
"

>

Delete

</button>






</div>



))


}



</div>








</main>


);



}
