"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Loader2,
  Save,
  Upload,
} from "lucide-react";


type ProductStatus =
  | "Active"
  | "Draft"
  | "Out of Stock"
  | "Archived";


type ProductForm = {
  sku: string;
  name: string;
  slug: string;

  category: string;
  subCategory: string;
  brand: string;

  shortDescription: string;
  description: string;

  mrp: string;
  price: string;

  stock: string;
  lowStockLimit: string;

  status: ProductStatus;


  thumbnail: string;

  images: string;


  sizes: string;
  colors: string;
  tags: string;


  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  trending: boolean;


  seoTitle: string;
  seoDescription: string;
};


const initialForm: ProductForm = {

  sku: "",
  name: "",
  slug: "",


  category: "",
  subCategory: "",
  brand: "SilentGEN",


  shortDescription: "",
  description: "",


  mrp: "",
  price: "",


  stock: "0",
  lowStockLimit: "5",


  status: "Active",


  thumbnail: "",

  images: "",


  sizes: "",
  colors: "",
  tags: "",


  featured: false,
  bestSeller: false,
  newArrival: false,
  trending: false,


  seoTitle: "",
  seoDescription: "",
};



function createSlug(value:string){

  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"");

}



function convertToArray(value:string){

  return value
    .split(",")
    .map((item)=>item.trim())
    .filter(Boolean);

}



export default function EditProductPage(){


  const params = useParams();

  const router = useRouter();


  const id = params.id as string;



  const [form,setForm] =
    useState<ProductForm>(initialForm);



  const [loading,setLoading] =
    useState(true);



  const [saving,setSaving] =
    useState(false);



  const [error,setError] =
    useState("");



  function updateField<K extends keyof ProductForm>(
    field:K,
    value:ProductForm[K]
  ){

    setForm((prev)=>({
      ...prev,
      [field]:value,
    }));

  }



  useEffect(()=>{


    async function loadProduct(){


      try{


        setLoading(true);


        const res =
          await fetch(
            `/api/admin/products/${id}`,
            {
              cache:"no-store",
            }
          );



        const data =
          await res.json();



        if(!res.ok){

          throw new Error(
            data.message ||
            "Product load failed"
          );

        }



        const product=data.product;



        setForm({

          sku:product.sku || "",

          name:product.name || "",

          slug:product.slug || "",


          category:
            product.category || "",


          subCategory:
            product.subCategory || "",


          brand:
            product.brand || "SilentGEN",


          shortDescription:
            product.shortDescription || "",


          description:
            product.description || "",



          mrp:
            String(product.mrp ?? ""),


          price:
            String(product.price ?? ""),



          stock:
            String(product.stock ?? 0),



          lowStockLimit:
            String(product.lowStockLimit ?? 5),



          status:
            product.status || "Active",



          thumbnail:
            product.thumbnail || "",



          images:
            Array.isArray(product.images)
            ?
            product.images.join(", ")
            :
            "",



          sizes:
            Array.isArray(product.sizes)
            ?
            product.sizes.join(", ")
            :
            "",



          colors:
            Array.isArray(product.colors)
            ?
            product.colors.join(", ")
            :
            "",



          tags:
            Array.isArray(product.tags)
            ?
            product.tags.join(", ")
            :
            "",



          featured:
            Boolean(product.featured),


          bestSeller:
            Boolean(product.bestSeller),


          newArrival:
            Boolean(product.newArrival),


          trending:
            Boolean(product.trending),



          seoTitle:
            product.seoTitle || "",



          seoDescription:
            product.seoDescription || "",


        });



      }
      catch(err:any){

        setError(
          err.message ||
          "Unable to load product"
        );

      }
      finally{

        setLoading(false);

      }


    }



    if(id){

      loadProduct();

    }


  },[id]);



  if(loading){

    return (

      <div className="flex min-h-screen items-center justify-center">

        <Loader2 className="animate-spin"/>

      </div>

    );

  }
  // ===============================
// SAVE PRODUCT
// ===============================

async function handleSubmit(
  event: FormEvent<HTMLFormElement>
){

  event.preventDefault();

  setError("");

  try{

    setSaving(true);


    const response =
      await fetch(
        `/api/admin/products/${id}`,
        {
          method:"PATCH",
          headers:{
            "Content-Type":"application/json",
          },

          body:JSON.stringify({

            ...form,


            sku:
              form.sku
              .trim()
              .toUpperCase(),


            name:
              form.name.trim(),


            slug:
              createSlug(
                form.slug ||
                form.name
              ),


            category:
              form.category.trim(),


            brand:
              form.brand.trim()
              ||
              "SilentGEN",



            mrp:Number(form.mrp),

            price:Number(form.price),

            stock:Number(form.stock),


            lowStockLimit:
              Number(form.lowStockLimit),



            images:
              convertToArray(
                form.images
              ),



            sizes:
              convertToArray(
                form.sizes
              ),



            colors:
              convertToArray(
                form.colors
              ),



            tags:
              convertToArray(
                form.tags
              ),

          }),

        }
      );



    const data =
      await response.json();



    if(!response.ok){

      setError(
        data.message ||
        "Update failed"
      );

      return;

    }



    router.push(
      "/admin/products"
    );

    router.refresh();



  }
  catch{

    setError(
      "Something went wrong"
    );

  }
  finally{

    setSaving(false);

  }

}



// ===============================
// PAGE UI
// ===============================


return (

<div className="mx-auto max-w-7xl p-6">


<div className="mb-8">


<Link
href="/admin/products"
className="inline-flex items-center gap-2 text-sm text-gray-600"
>

<ArrowLeft size={18}/>

Back Products

</Link>



<h1 className="mt-4 text-3xl font-bold">

Edit Product

</h1>


<p className="text-gray-500 mt-2">

Update product details

</p>


</div>



{
error &&

<div className="mb-5 rounded-lg bg-red-50 p-4 text-red-600">

{error}

</div>

}




<form
onSubmit={handleSubmit}
className="space-y-8"
>



<div className="grid gap-6 rounded-xl border bg-white p-6 md:grid-cols-2">


{/* SKU */}

<div>

<label className="font-semibold">

SKU *

</label>


<input

value={form.sku}

onChange={(e)=>
updateField(
"sku",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>

</div>





{/* NAME */}

<div>

<label className="font-semibold">

Product Name *

</label>


<input

value={form.name}

onChange={(e)=>{


updateField(
"name",
e.target.value
);


updateField(
"slug",
createSlug(
e.target.value
)
);


}}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>





{/* SLUG */}

<div>

<label className="font-semibold">

Slug

</label>


<input

value={form.slug}

onChange={(e)=>
updateField(
"slug",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>





{/* BRAND */}

<div>

<label className="font-semibold">

Brand

</label>


<input

value={form.brand}

onChange={(e)=>
updateField(
"brand",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>





{/* CATEGORY */}

<div>

<label className="font-semibold">

Category *

</label>


<input

value={form.category}

onChange={(e)=>
updateField(
"category",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>





{/* SUB CATEGORY */}

<div>

<label className="font-semibold">

Sub Category

</label>


<input

value={form.subCategory}

onChange={(e)=>
updateField(
"subCategory",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>





{/* MRP */}

<div>

<label className="font-semibold">

MRP

</label>


<input

type="number"

value={form.mrp}

onChange={(e)=>
updateField(
"mrp",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>





{/* PRICE */}

<div>

<label className="font-semibold">

Selling Price

</label>


<input

type="number"

value={form.price}

onChange={(e)=>
updateField(
"price",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>
// ===============================
// STOCK
// ===============================

<div>

<label className="font-semibold">
Stock
</label>

<input

type="number"

value={form.stock}

onChange={(e)=>
updateField(
"stock",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>

</div>





// ===============================
// LOW STOCK LIMIT
// ===============================


<div>

<label className="font-semibold">
Low Stock Limit
</label>


<input

type="number"

value={form.lowStockLimit}

onChange={(e)=>
updateField(
"lowStockLimit",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>






// ===============================
// STATUS
// ===============================


<div className="md:col-span-2">


<label className="font-semibold">

Status

</label>



<select

value={form.status}

onChange={(e)=>
updateField(
"status",
e.target.value as ProductStatus
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

>


<option value="Active">
Active
</option>


<option value="Draft">
Draft
</option>


<option value="Out of Stock">
Out of Stock
</option>


<option value="Archived">
Archived
</option>


</select>


</div>






// ===============================
// DESCRIPTION
// ===============================


<div className="md:col-span-2">


<label className="font-semibold">

Short Description

</label>


<textarea

rows={3}

value={form.shortDescription}

onChange={(e)=>
updateField(
"shortDescription",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>





<div className="md:col-span-2">


<label className="font-semibold">

Description

</label>


<textarea

rows={6}

value={form.description}

onChange={(e)=>
updateField(
"description",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>








// ===============================
// IMAGE SYSTEM
// URL + JPG UPLOAD READY
// ===============================


<div className="md:col-span-2">


<label className="font-semibold">

Thumbnail Image URL

</label>


<input

value={form.thumbnail}

onChange={(e)=>
updateField(
"thumbnail",
e.target.value
)
}

placeholder="https://image-url.jpg"

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>







<div className="md:col-span-2">


<label className="font-semibold">

Upload JPG Image

</label>


<div className="mt-2 flex items-center gap-4">


<input

type="file"

accept="image/jpeg,image/png"

className="w-full rounded-lg border p-3"

/>



<button

type="button"

className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-white"

>


<Upload size={18}/>


Upload


</button>


</div>


<p className="mt-2 text-sm text-gray-500">

JPG / PNG upload support (Cloudinary connection next step)

</p>


</div>







// ===============================
// MULTIPLE IMAGES URL
// ===============================


<div className="md:col-span-2">


<label className="font-semibold">

Images URL (comma separated)

</label>


<textarea

rows={3}

value={form.images}

onChange={(e)=>
updateField(
"images",
e.target.value
)
}

placeholder="image1.jpg, image2.jpg"

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>








// ===============================
// SIZE COLOR TAG
// ===============================


<div>


<label className="font-semibold">

Sizes

</label>


<input

value={form.sizes}

onChange={(e)=>
updateField(
"sizes",
e.target.value
)
}

placeholder="S,M,L,XL"

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>





<div>


<label className="font-semibold">

Colors

</label>


<input

value={form.colors}

onChange={(e)=>
updateField(
"colors",
e.target.value
)
}

placeholder="Black,White"

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>





<div className="md:col-span-2">


<label className="font-semibold">

Tags

</label>


<input

value={form.tags}

onChange={(e)=>
updateField(
"tags",
e.target.value
)
}

placeholder="cotton,shirt,fashion"

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>
// ===============================
// PRODUCT FLAGS
// ===============================


<div className="md:col-span-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">


<label className="flex items-center gap-3">

<input

type="checkbox"

checked={form.featured}

onChange={(e)=>
updateField(
"featured",
e.target.checked
)
}

/>

Featured

</label>





<label className="flex items-center gap-3">


<input

type="checkbox"

checked={form.bestSeller}

onChange={(e)=>
updateField(
"bestSeller",
e.target.checked
)
}

/>


Best Seller


</label>





<label className="flex items-center gap-3">


<input

type="checkbox"

checked={form.newArrival}

onChange={(e)=>
updateField(
"newArrival",
e.target.checked
)
}

/>


New Arrival


</label>





<label className="flex items-center gap-3">


<input

type="checkbox"

checked={form.trending}

onChange={(e)=>
updateField(
"trending",
e.target.checked
)
}

/>


Trending


</label>



</div>






// ===============================
// SEO
// ===============================


<div className="md:col-span-2">


<label className="font-semibold">

SEO Title

</label>


<input

value={form.seoTitle}

onChange={(e)=>
updateField(
"seoTitle",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>






<div className="md:col-span-2">


<label className="font-semibold">

SEO Description

</label>


<textarea

rows={3}

value={form.seoDescription}

onChange={(e)=>
updateField(
"seoDescription",
e.target.value
)
}

className="mt-2 w-full rounded-lg border px-4 py-3"

/>


</div>





</div>







// ===============================
// SAVE BUTTON
// ===============================


<div className="flex justify-end">


<button

type="submit"

disabled={saving}

className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white disabled:opacity-50"

>


{
saving ?

<>

<Loader2
size={18}
className="animate-spin"
/>

Updating...

</>

:

<>

<Save size={18}/>

Update Product

</>

}



</button>


</div>





</form>


</div>


);


}
