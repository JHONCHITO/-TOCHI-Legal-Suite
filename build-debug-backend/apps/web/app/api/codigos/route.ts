import dbConnect from "@/lib/mongodb";
import Norma from "@/lib/models/Norma";

export async function GET() {
  await dbConnect();

  const codigos = await Norma.distinct("codigo");

  return Response.json(codigos);
}