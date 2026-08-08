import Hero from "@/components/Hero/Hero";
import FeaturedProducts from "@/components/FeaturedProducts/FeaturedProducts";
import ShopByCategory from "@/components/ShopByCategory/ShopByCategory";
import ShopByGender from "@/components/ShopByGender/ShopByGender";

export default function Home() {
  return (
    <>
      <Hero />

      <FeaturedProducts />

      <ShopByCategory />

      <ShopByGender />
    </>
  );
}