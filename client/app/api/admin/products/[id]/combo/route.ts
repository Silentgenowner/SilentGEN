import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import { ComboOffer } from "@/models/ComboOffer";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const now = new Date();
  const combo = await ComboOffer.findOne({
    products: id,
    isActive: true,
    $and: [{ $or: [{ startsAt: null }, { startsAt: { $lte: now } }] }, { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] }],
  }).populate("products", "name sku price thumbnail stock status sizes colors").lean();
  return NextResponse.json({ success: true, combo: combo || null });
}
