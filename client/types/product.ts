export interface Product {

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

  lowStockLimit: number;

  sold: number;

  thumbnail: string;

  images: string[];

  sizes: string[];

  colors: string[];

  tags: string[];

  featured: boolean;

  bestSeller: boolean;

  newArrival: boolean;

  trending: boolean;

  status: string;

  sortOrder: number;

  rating: number;

  reviewCount: number;

  seoTitle: string;

  seoDescription: string;

  createdAt: string;

  updatedAt: string;

}
