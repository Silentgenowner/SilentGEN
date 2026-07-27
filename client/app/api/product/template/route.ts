import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const data = [
    {
      SKU: "SG0001",
      Name: "Premium Shirt",
      Description: "100% Cotton Shirt",
      Category: "Shirts",
      Brand: "SilentGEN",
      Price: 1499,
      Stock: 25,
      Sizes: "S,M,L,XL",
      Colors: "Black,White",
      Featured: "No",
      Image1: "https://example.com/image1.jpg",
      Image2: "",
      Image3: "",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Products"
  );

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="SilentGEN_Product_Template.xlsx"',
    },
  });
}
