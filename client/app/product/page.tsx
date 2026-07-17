import ProductCard from "@/components/ProductCard/ProductCard";
import { products } from "@/Data/products";


export default function ProductsPage() {

  return (
    <main className="min-h-screen bg-gray-100">

      <div className="max-w-7xl mx-auto px-6 py-12">

        <h1 className="text-4xl font-bold mb-8">
          Shop Products
        </h1>


        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">

          {products.map((product) => (

            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
            />

          ))}

        </div>

      </div>

    </main>
  );
}
