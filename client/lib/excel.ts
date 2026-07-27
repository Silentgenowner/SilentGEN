import * as XLSX from "xlsx";

export type ExcelProduct = {
  SKU?: string;
  Name: string;
  Description: string;
  Category: string;
  Brand: string;
  Price: number;
  MRP?: number;
  Stock: number;
  Sizes?: string;
  Colors?: string;
  Featured?: string;
  Image1?: string;
  Image2?: string;
  Image3?: string;
};

export function readExcel(buffer: Buffer): ExcelProduct[] {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
  });

  const sheetName = workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json<ExcelProduct>(
    worksheet,
    {
      defval: "",
    }
  );

  return data;
}
