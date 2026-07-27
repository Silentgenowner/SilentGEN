"use client";

import { useEffect, useState } from "react";


type Address = {

  _id?: string;

  fullName:string;

  mobile:string;

  address:string;

  area:string;

  city:string;

  state:string;

  country:string;

  pincode:string;

  landmark:string;

  isDefault?:boolean;

};



const emptyForm = {

  fullName:"",

  mobile:"",

  address:"",

  area:"",

  city:"",

  state:"",

  country:"India",

  pincode:"",

  landmark:"",

};






export default function AddressPage(){



const [addresses,setAddresses] =
useState<Address[]>([]);



const [loading,setLoading] =
useState(true);



const [showForm,setShowForm] =
useState(false);



const [editId,setEditId] =
useState<string|null>(null);



const [form,setForm] =
useState<Address>(emptyForm);








useEffect(()=>{

fetchAddresses();

},[]);








async function fetchAddresses(){


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

console.log(
"ADDRESS FETCH ERROR",
error
);

}
finally{

setLoading(false);

}


}









function handleEdit(
item:Address
){


setEditId(
item._id || null
);



setForm({

fullName:item.fullName,

mobile:item.mobile,

address:item.address,

area:item.area,

city:item.city,

state:item.state,

country:item.country,

pincode:item.pincode,

landmark:item.landmark || "",

});



setShowForm(true);


}









async function saveAddress(){



if(
!form.fullName ||
!form.mobile ||
!form.address ||
!form.city ||
!form.state ||
!form.pincode
){

alert(
"Please fill required fields"
);

return;

}





const url =

editId

?

`/api/address/${editId}`

:

"/api/address";





const method =

editId

?

"PUT"

:

"POST";






try{


const res =
await fetch(

url,

{

method,

headers:{

"Content-Type":
"application/json"

},

body:

JSON.stringify(form)

}

);





const data =
await res.json();





if(data.success){


setForm(emptyForm);


setEditId(null);


setShowForm(false);


fetchAddresses();


}
else{


alert(data.message);


}



}
catch(error){


console.log(error);


}


}









async function deleteAddress(
id:string
){


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

fetchAddresses();

}


}









async function setDefaultAddress(
id:string
){



const res =
await fetch(

`/api/address/default/${id}`,

{

method:"PUT"

}

);



const data =
await res.json();



if(data.success){

fetchAddresses();

}


}









if(loading){

return(

<div className="p-10">

Loading Addresses...

</div>

);

}









return(


<div>



<div className="
flex
justify-between
items-center
mb-8
">


<h1 className="
text-3xl
font-bold
">

My Addresses

</h1>




<button

onClick={()=>{

setShowForm(!showForm);

setEditId(null);

setForm(emptyForm);

}}

className="
bg-black
text-white
px-5
py-3
rounded-lg
"

>

+ Add Address

</button>



</div>









{
showForm && (

<div className="
border
rounded-xl
p-6
mb-8
space-y-4
">





<input

placeholder="Full Name"

value={form.fullName || ""}

onChange={(e)=>

setForm({

...form,

fullName:e.target.value

})

}

className="
w-full
border
rounded-lg
p-3
"

/>








<input

placeholder="Mobile Number"

value={form.mobile || ""}

onChange={(e)=>

setForm({

...form,

mobile:e.target.value

})

}

className="
w-full
border
rounded-lg
p-3
"

/>








<input

placeholder="Address"

value={form.address || ""}

onChange={(e)=>

setForm({

...form,

address:e.target.value

})

}

className="
w-full
border
rounded-lg
p-3
"

/>







<input

placeholder="Area"

value={form.area || ""}

onChange={(e)=>

setForm({

...form,

area:e.target.value

})

}

className="
w-full
border
rounded-lg
p-3
"

/>








<input

placeholder="City"

value={form.city || ""}

onChange={(e)=>

setForm({

...form,

city:e.target.value

})

}

className="
w-full
border
rounded-lg
p-3
"

/>








<input

placeholder="State"

value={form.state || ""}

onChange={(e)=>

setForm({

...form,

state:e.target.value

})

}

className="
w-full
border
rounded-lg
p-3
"

/>








<input

placeholder="Country"

value={form.country || ""}

onChange={(e)=>

setForm({

...form,

country:e.target.value

})

}

className="
w-full
border
rounded-lg
p-3
"

/>








<input

placeholder="Pincode"

value={form.pincode || ""}

onChange={(e)=>

setForm({

...form,

pincode:e.target.value

})

}

className="
w-full
border
rounded-lg
p-3
"

/>








<input

placeholder="Landmark"

value={form.landmark || ""}

onChange={(e)=>

setForm({

...form,

landmark:e.target.value

})

}

className="
w-full
border
rounded-lg
p-3
"

/>









<button

onClick={saveAddress}

className="
bg-black
text-white
px-6
py-3
rounded-lg
"

>

{

editId

?

"Update Address"

:

"Save Address"

}

</button>





</div>

)

}









{
addresses.length===0

?

<div className="
border
rounded-xl
p-10
text-center
">

No Address Found

</div>


:


<div className="space-y-5">


{

addresses.map((item)=>(


<div

key={item._id}

className="
border
rounded-xl
p-5
"

>



{
item.isDefault &&

<span className="
bg-black
text-white
px-3
py-1
rounded
text-sm
">

Default

</span>

}




<h2 className="
text-xl
font-bold
mt-3
">

{item.fullName}

</h2>



<p>

{item.mobile}

</p>



<p>

{item.address}

</p>



<p>

{item.area}

</p>



<p>

{item.city}, {item.state}

</p>



<p>

{item.country} - {item.pincode}

</p>




{
item.landmark &&

<p>

Landmark: {item.landmark}

</p>

}







<div className="
flex
gap-5
mt-5
">


<button

onClick={()=>handleEdit(item)}

className="
text-blue-600
"

>

Edit

</button>




<button

onClick={()=>deleteAddress(item._id!)}

className="
text-red-600
"

>

Delete

</button>






{

!item.isDefault &&

<button

onClick={()=>setDefaultAddress(item._id!)}

className="
text-green-600
"

>

Set Default

</button>

}



</div>



</div>


))

}


</div>


}



</div>


);


}
