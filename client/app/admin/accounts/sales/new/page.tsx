"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";



type Product = {
  _id:string;
  name:string;
  price:number;
  stock:number;
};



type InvoiceItem = {

  productId:string;

  name:string;

  quantity:number;

  price:number;

  discount:number;

  gstRate:number;

};




export default function CreateSalesInvoicePage(){


const router = useRouter();



const [loading,setLoading]=
useState(false);



const [products,setProducts]=
useState<Product[]>([]);



const [customerName,setCustomerName]=
useState("");



const [customerPhone,setCustomerPhone]=
useState("");



const [items,setItems]=
useState<InvoiceItem[]>([]);




useEffect(()=>{

loadProducts();

},[]);





async function loadProducts(){


try{


const res =
await fetch(
"/api/admin/products",
{
cache:"no-store",
}
);



const data =
await res.json();



if(data.success){

setProducts(
data.products || []
);

}



}
catch(error){

console.log(error);

}


}






function addItem(){


setItems([

...items,

{

productId:"",

name:"",

quantity:1,

price:0,

discount:0,

gstRate:18,

}

]);


}





function removeItem(index:number){


setItems(

items.filter(
(_,i)=>i!==index
)

);


}






function updateItem(
  index: number,
  key: keyof InvoiceItem,
  value: string | number
) {
  const copy = [...items];

  copy[index] = {
    ...copy[index],
    [key]: value,
  };

  setItems(copy);

}



function calculateTotal(){


return items.reduce(
(total,item)=>{


const amount =
item.quantity *
item.price;


const discount =
amount *
(item.discount/100);



const taxable =
amount-discount;



const gst =
taxable *
(item.gstRate/100);



return total+
taxable+
gst;


},
0
);


}

async function saveInvoice(){

  try{

    setLoading(true);

    const response = await fetch(
      "/api/admin/accounts/sales",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify({

          customerName,
          customerPhone,
          items,
          grandTotal:calculateTotal(),

        }),
      }
    );


    const data =
    await response.json();


    if(data.success){

      alert("Invoice Created");

      router.push(
        "/admin/accounts/sales"
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

  return (

<div className="space-y-8">


{/* Header */}

<section className="
rounded-3xl
bg-black
p-8
text-white
">


<h1 className="
text-3xl
font-bold
">

Create Sales Invoice

</h1>


<p className="
mt-2
text-gray-300
">

Create customer invoice with GST calculation.

</p>


</section>





{/* Customer */}

<section className="
rounded-2xl
border
bg-white
p-6
space-y-5
">


<h2 className="
text-xl
font-bold
">

Customer Details

</h2>



<div className="
grid
md:grid-cols-2
gap-5
">


<input

value={customerName}

onChange={(e)=>
setCustomerName(e.target.value)
}

placeholder="Customer Name"

className="
border
rounded-xl
px-4
py-3
"

/>




<input

value={customerPhone}

onChange={(e)=>
setCustomerPhone(e.target.value)
}

placeholder="Mobile Number"

className="
border
rounded-xl
px-4
py-3
"

/>


</div>


</section>









{/* Products */}


<section className="
rounded-2xl
border
bg-white
p-6
">


<div className="
flex
justify-between
items-center
mb-5
">


<h2 className="
text-xl
font-bold
">

Products

</h2>



<button

onClick={addItem}

className="
flex
items-center
gap-2
bg-black
text-white
px-4
py-2
rounded-xl
"

>


<Plus size={18}/>

Add Product


</button>


</div>








<div className="
space-y-5
">


{
items.map(
(item,index)=>(


<div

key={index}

className="
border
rounded-xl
p-5
grid
md:grid-cols-6
gap-4
items-center
"

>



<select

value={item.productId}

onChange={(e)=>{


const product =
products.find(
(p)=>
p._id===e.target.value
);



updateItem(
index,
"productId",
e.target.value
);



if(product){

updateItem(
index,
"name",
product.name
);


updateItem(
index,
"price",
product.price
);

}


}}

className="
border
rounded-lg
px-3
py-2
"

>


<option value="">

Select Product

</option>


{
products.map(
(product)=>(


<option

key={product._id}

value={product._id}

>

{product.name}

</option>


)

)

}


</select>







<input

type="number"

value={item.quantity}

onChange={(e)=>
updateItem(
index,
"quantity",
Number(e.target.value)
)
}

placeholder="Qty"

className="
border
rounded-lg
px-3
py-2
"

/>







<input

type="number"

value={item.price}

onChange={(e)=>
updateItem(
index,
"price",
Number(e.target.value)
)
}

placeholder="Price"

className="
border
rounded-lg
px-3
py-2
"

/>






<input

type="number"

value={item.discount}

onChange={(e)=>
updateItem(
index,
"discount",
Number(e.target.value)
)
}

placeholder="Discount %"

className="
border
rounded-lg
px-3
py-2
"

/>






<input

type="number"

value={item.gstRate}

onChange={(e)=>
updateItem(
index,
"gstRate",
Number(e.target.value)
)
}

placeholder="GST %"

className="
border
rounded-lg
px-3
py-2
"

/>






<button

onClick={()=>
removeItem(index)
}

className="
text-red-600
"

>

<Trash2 size={22}/>


</button>






</div>


)

)

}



</div>



</section>
{/* Invoice Summary */}


<section className="
rounded-2xl
border
bg-white
p-6
">


<div className="
flex
flex-col
md:flex-row
justify-between
gap-6
items-center
">


<div>


<h2 className="
text-2xl
font-bold
">

Invoice Total

</h2>


<p className="
text-gray-500
mt-2
">

Including GST and discount

</p>


</div>





<div className="
text-4xl
font-bold
">

₹
{calculateTotal().toLocaleString(
"en-IN"
)}

</div>


</div>


</section>








{/* Save Button */}


<section className="
flex
justify-end
">


<button

disabled={loading}

onClick={saveInvoice}

className="
flex
items-center
gap-2
bg-black
text-white
px-8
py-3
rounded-xl
hover:bg-gray-800
disabled:opacity-50
"

>


{
loading ?

<Loader2
size={20}
className="animate-spin"
/>

:

<Save
size={20}
/>

}


Save Invoice


</button>


</section>





</div>


);



}