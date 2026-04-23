import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ley from "@/lib/models/Ley";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const ley = await Ley.findById(params.id);
  return NextResponse.json(ley);
}