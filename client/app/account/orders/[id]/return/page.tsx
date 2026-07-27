"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";




export default function ReturnPage(){



const params =
useParams();



const router =
useRouter();



const orderId =
params.id as string;





const [reason,setReason] =
useState("");



const [message,setMessage] =
useState("");



const [loading,setLoading] =
useState(false);







async function submitReturn(){



if(!reason){


setMessage(
"Please select return reason"
);


return;


}




try{


setLoading(true);





const res =
await fetch(

"/api/order/return",

{


method:"POST",


headers:{


"Content-Type":
"application/json"


},



body:JSON.stringify({


orderId,

reason



})


}

);







const data =
await res.json();






if(data.success){


setMessage(
"Return request submitted successfully"
);



setTimeout(()=>{


router.push(
`/account/orders/${orderId}`
);


},1500);



}
else{


setMessage(
data.message
);


}




}
catch(error){


console.log(error);


setMessage(
"Something went wrong"
);


}
finally{


setLoading(false);


}



}









return(


<main className="
max-w-xl
mx-auto
px-6
py-10
">





<h1 className="
text-3xl
font-bold
mb-8
">

Return Product

</h1>







<div className="
bg-white
shadow
rounded-xl
p-6
">





<label className="
font-semibold
">

Select Reason


</label>






<select

value={reason}

onChange={(e)=>
setReason(e.target.value)
}

className="
w-full
border
rounded-lg
p-3
mt-3
"

>


<option value="">

Choose reason

</option>



<option value="Size issue">

Size issue

</option>




<option value="Damaged product">

Damaged product

</option>




<option value="Wrong product">

Wrong product

</option>




<option value="Quality issue">

Quality issue

</option>




<option value="Other">

Other

</option>




</select>








<button


onClick={submitReturn}


disabled={loading}


className="
w-full
mt-6
bg-black
text-white
py-3
rounded-lg
disabled:opacity-50
"

>


{

loading

?

"Submitting..."

:

"Submit Return Request"

}



</button>







{

message &&

<p className="
mt-5
text-center
font-semibold
">

{message}

</p>


}





</div>






</main>


);



}
