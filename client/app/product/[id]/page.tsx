"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import ProductGallery from "@/components/Product/ProductGallery";
import ProductInfo from "@/components/Product/ProductInfo";
import ProductActions from "@/components/Product/ProductActions";
import ProductTabs from "@/components/Product/ProductTabs";
import RelatedProducts, {
  RelatedProduct,
} from "@/components/Product/RelatedProducts";

type Product = {
  _id: string;
  sku: string;
  name: string;
  slug: string;

  shortDescription: string;
  description: string;

  category: string;
  subCategory: string;
  brand: string;

  gender: string;
  fabric: string;
  fit: string;

  gsm: number;
  weight: number;

  mrp: number;
  price: number;
  discount: number;

  stock: number;

  thumbnail: string;
  images: string[];

  sizes: string[];
  colors: string[];

  rating: number;
  reviewCount: number;
};

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  async function fetchProduct() {
    try {
      setLoading(true);

      const res = await fetch(`/api/product/${id}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data.success) {
        setProduct(null);
        return;
      }

      setProduct(data.product);

      if (data.product.category) {
        fetchRelated(data.product.category);
      }
    } catch (error) {
      console.error(error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRelated(category: string) {
    try {
      const res = await fetch(
        `/api/product?category=${encodeURIComponent(category)}`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) return;

      const data = await res.json();

      if (data.success && Array.isArray(data.products)) {
        setRelated(
          data.products.filter(
            (item: RelatedProduct) =>
              item._id !== id
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-xl">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-bold">
          Product Not Found
        </h2>

        <p className="mt-2 text-gray-500">
          This product does not exist.
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">

      <div className="grid gap-10 lg:grid-cols-2">

        <ProductGallery
          images={product.images}
          thumbnail={product.thumbnail}
          name={product.name}
        />

        <div className="space-y-8">

          <ProductInfo
            name={product.name}
            brand={product.brand}
            category={product.category}
            shortDescription={product.shortDescription}
            price={product.price}
            mrp={product.mrp}
            discount={product.discount}
            rating={product.rating}
            reviewCount={product.reviewCount}
            stock={product.stock}
            fabric={product.fabric}
            fit={product.fit}
            gsm={product.gsm}
            weight={product.weight}
          />

          <ProductActions
            productId={product._id}
            stock={product.stock}
            sizes={product.sizes}
            colors={product.colors}
          />

        </div>

      </div>

      <ProductTabs
        description={product.description}
        category={product.category}
        brand={product.brand}
        fabric={product.fabric}
        fit={product.fit}
        gsm={product.gsm}
        weight={product.weight}
        sku={product.sku}
        rating={product.rating}
        reviewCount={product.reviewCount}
      />

      {related.length > 0 && (
        <RelatedProducts
          products={related.slice(0, 4)}
        />
      )}

    </main>
  );
}
