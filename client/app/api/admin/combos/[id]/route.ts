import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/connectDB";
import { ComboOffer } from "@/models/ComboOffer";
import { buildComboData } from "@/lib/combo-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  // Add your existing admin guard here: await requireAdmin();
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid combo ID." }, { status: 400 });
  await connectDB();
  const combo = await ComboOffer.findById(id).populate("products", "name sku slug price thumbnail status stock").lean();
  return combo ? NextResponse.json({ combo }) : NextResponse.json({ message: "Combo not found." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  // Add your existing admin guard here: await requireAdmin();
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid combo ID." }, { status: 400 });
  try {
    await connectDB();
    if (!(await ComboOffer.exists({ _id: id }))) return NextResponse.json({ message: "Combo not found." }, { status: 404 });
    const combo = await ComboOffer.findByIdAndUpdate(id, await buildComboData(await request.json(), id), { new: true, runValidators: true }).populate("products", "name sku slug price thumbnail status stock");
    return NextResponse.json({ combo });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to update combo." }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  // Add your existing admin guard here: await requireAdmin();
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid combo ID." }, { status: 400 });
  await connectDB();
  const combo = await ComboOffer.findByIdAndDelete(id);
  return combo ? NextResponse.json({ message: "Combo deleted." }) : NextResponse.json({ message: "Combo not found." }, { status: 404 });
}
