import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import { ComboOffer } from "@/models/ComboOffer";
import { buildComboData } from "@/lib/combo-validation";

export async function GET() {
  // Add your existing admin guard here: await requireAdmin();
  await connectDB();
  const combos = await ComboOffer.find().populate("products", "name sku slug price thumbnail status stock").sort({ createdAt: -1 }).lean();
  return NextResponse.json({ combos });
}

export async function POST(request: Request) {
  // Add your existing admin guard here: await requireAdmin();
  try {
    await connectDB();
    const combo = await ComboOffer.create(await buildComboData(await request.json()));
    await combo.populate("products", "name sku slug price thumbnail status stock");
    return NextResponse.json({ combo }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to create combo." }, { status: 400 });
  }
}
