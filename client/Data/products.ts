export type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  stock: number;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Premium T-Shirt",
    price: 999,
    image: "/images/tshirt.jpg",
    category: "Clothing",
    description:
      "Premium cotton T-shirt with a modern fit. Soft, breathable and comfortable for everyday wear.",
    stock: 20,
  },
  {
    id: 2,
    name: "Running Shoes",
    price: 2499,
    image: "/images/shoes.jpg",
    category: "Shoes",
    description:
      "Lightweight running shoes designed for comfort, grip and all-day performance.",
    stock: 15,
  },
  {
    id: 3,
    name: "Classic Watch",
    price: 1999,
    image: "/images/watch.jpg",
    category: "Watches",
    description:
      "Elegant wrist watch with premium finish suitable for casual and formal outfits.",
    stock: 10,
  },
  {
    id: 4,
    name: "Travel Bag",
    price: 1499,
    image: "/images/bag.jpg",
    category: "Bags",
    description:
      "Spacious and durable travel bag with premium quality material.",
    stock: 18,
  },
];
