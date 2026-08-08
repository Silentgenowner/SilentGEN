"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Loader2,
  ArrowLeft,
  Printer,
  FileText,
} from "lucide-react";



type InvoiceItem = {

  name:string;

  quantity:number;

  price:number;

  discount:number;

  gstRate:number;

  total?:number;

};




type Invoice = {

  _id:string;

  invoiceNumber:string;

  invoiceDate:string;


  customerName:string;

  customerPhone?:string;

  customerAddress?:string;



  items:InvoiceItem[];



  subtotal:number;

  discountTotal:number;

  taxableAmount:number;

  cgstTotal:number;

  sgstTotal:number;

  igstTotal:number;

  grandTotal:number;


  paymentStatus:
  | "unpaid"
  | "partial"
  | "paid";

};






export default function InvoiceDetailPage(){


const params =
useParams();



const id =
params.id as string;



const [loading,setLoading]=
useState(true);



const [invoice,setInvoice]=
useState<Invoice | null>(null);






useEffect(()=>{


if(id){

loadInvoice();

}


},[id]);








async function loadInvoice(){


try{


const res =
await fetch(
`/api/admin/accounts/sales/${id}`,
{
cache:"no-store",
}
);



const data =
await res.json();



if(data.success){

setInvoice(
data.invoice
);

}



}
catch(error){

console.log(
error
);

}
finally{

setLoading(false);

}


}







if(loading){


return(

<div
className="
flex
h-[60vh]
items-center
justify-center
"
>

<Loader2
className="
animate-spin
"
/>

</div>

);

}







if(!invoice){


return(

<div
className="
text-center
py-20
"
>


<FileText
size={50}
className="
mx-auto
mb-4
"
/>


<h2
className="
text-xl
font-bold
"
>

Invoice Not Found

</h2>


</div>

);


}








return(


<div
className="
space-y-8
"
>





{/* Header */}


<div
className="
flex
items-center
justify-between
"
>


<Link

href="/admin/accounts/sales"

className="
flex
items-center
gap-2
text-gray-600
"

>

<ArrowLeft size={18}/>

Back


</Link>





<button

onClick={()=>window.print()}

className="
flex
items-center
gap-2
rounded-xl
bg-black
px-5
py-3
text-white
"

>

<Printer size={18}/>

Print


</button>




</div>









{/* Invoice */}



<section

className="
rounded-3xl
border
bg-white
p-8
shadow-sm
"

>


<div
className="
flex
justify-between
border-b
pb-6
"

>


<div>

<h1
className="
text-3xl
font-bold
"
>

SilentGEN

</h1>


<p
className="
text-gray-500
"
>

Fashion Store Invoice

</p>


</div>





<div
className="
text-right
"
>


<h2
className="
text-xl
font-bold
"
>

{invoice.invoiceNumber}

</h2>


<p
className="
text-gray-500
"
>

{
new Date(
invoice.invoiceDate
)
.toLocaleDateString(
"en-IN"
)
}

</p>


</div>



</div>









{/* Customer */}



<div
className="
grid
md:grid-cols-2
gap-8
py-8
"

>


<div>

<h3
className="
font-bold
mb-2
"
>

Bill To

</h3>


<p>

{invoice.customerName}

</p>


<p>

{invoice.customerPhone}

</p>


<p>

{invoice.customerAddress}

</p>


</div>





<div>

<h3
className="
font-bold
mb-2
"
>

Payment Status

</h3>


<span

className="
rounded-full
bg-green-100
px-4
py-2
text-green-700
text-sm
font-semibold
"

>

{invoice.paymentStatus}

</span>


</div>



</div>









{/* Items */}



<div
className="
overflow-x-auto
"
>


<table
className="
w-full
"
>


<thead
className="
bg-gray-100
"
>


<tr>


<th className="p-4 text-left">
Product
</th>


<th className="p-4 text-left">
Qty
</th>


<th className="p-4 text-left">
Price
</th>


<th className="p-4 text-left">
GST
</th>


<th className="p-4 text-left">
Amount
</th>


</tr>


</thead>





<tbody>


{
invoice.items.map(
(item,index)=>(


<tr
key={index}
className="
border-t
"
>


<td
className="
p-4
"
>

{item.name}

</td>


<td
className="
p-4
"
>

{item.quantity}

</td>


<td
className="
p-4
"
>

₹{item.price}

</td>


<td
className="
p-4
"
>

{item.gstRate}%

</td>


<td
className="
p-4
font-semibold
"
>

₹
{
(
item.quantity *
item.price
)
.toLocaleString(
"en-IN"
)
}

</td>


</tr>


)

)

}



</tbody>


</table>


</div>










{/* Total */}



<div
className="
mt-8
flex
justify-end
"

>


<div
className="
w-full
md:w-80
space-y-3
"

>


<div
className="
flex
justify-between
"
>

<span>
Subtotal
</span>

<span>
₹{invoice.subtotal}
</span>

</div>



<div
className="
flex
justify-between
"
>

<span>
Discount
</span>

<span>
₹{invoice.discountTotal}
</span>

</div>




<div
className="
flex
justify-between
"
>

<span>
GST
</span>

<span>
₹
{
(
invoice.cgstTotal+
invoice.sgstTotal+
invoice.igstTotal
)
}

</span>

</div>





<div
className="
border-t
pt-4
flex
justify-between
text-xl
font-bold
"
>


<span>
Total
</span>


<span>

₹
{
invoice.grandTotal
.toLocaleString(
"en-IN"
)
}

</span>


</div>



</div>


</div>







</section>





</div>


);


}