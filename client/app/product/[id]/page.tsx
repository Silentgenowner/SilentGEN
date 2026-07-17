import Image from "next/image";
import { notFound } from "next/navigation";
import { products } from "@/Data/products";

type Props = {
  params: Promise<{
    id: string;
  }>;
};


export default async function ProductDetails({ params }: Props) {

  const { id } = await params;


  const product = products.find(
    (item) => item.id === Number(id)
  );


  if (!product) {
    notFound();
  }


  return (

    <main className="min-h-screen bg-gray-100">

      <div className="max-w-7xl mx-auto px-6 py-12">


        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">


          <div>

            <Image
              src={product.image}
              alt={product.name}
              width={700}
              height={700}
              priority
              className="rounded-xl w-full"
            />

          </div>



          <div>


            <h1 className="text-4xl font-bold">
              {product.name}
            </h1>


            <p className="text-3xl font-semibold mt-5">
              ₹{product.price}
            </p>


            <p className="mt-6 text-gray-600 leading-7">
              {product.description}
            </p>


            <p className="mt-5">
              <b>Category:</b> {product.category}
            </p>


            <p className="mt-2">
              <b>Stock:</b> {product.stock}
            </p>


            <button
              className="mt-8 bg-black text-white px-8 py-3 rounded-lg"
            >
              Add To Cart
            </button>


          </div>


        </div>


      </div>


    </main>

  );
}
