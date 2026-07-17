import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoose";

export async function GET() {
  try {
    const client = await clientPromise;

    await client.db("admin").command({ ping: 1 });

    return NextResponse.json({
      success: true,
      message: "MongoDB Connected Successfully 🚀",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "MongoDB Connection Failed",
      },
      { status: 500 }
    );
  }
}
