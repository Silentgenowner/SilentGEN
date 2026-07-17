import ProductCard from "@/components/ProductCard/ProductCard";
import { products } from "@/Data/products";

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-gray-100">

      <section className="max-w-7xl mx-auto px-6 py-12">

        <div className="mb-10">

          <h1 className="text-4xl font-bold">
            Shop
          </h1>

          <p className="text-gray-500 mt-2">
            Premium Fashion & Accessories
          </p>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

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

      </section>

    </main>
  );
}
