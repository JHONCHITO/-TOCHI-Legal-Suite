import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

// 🔥 Esquema del chat
const ChatSchema = new mongoose.Schema({
  mensajes: [
    {
      rol: String,
      texto: String,
      fuentes: Array,
    },
  ],
  creadoEn: {
    type: Date,
    default: Date.now,
  },
});

// Evitar duplicación en Next.js
const Chat =
  mongoose.models.Chat || mongoose.model("Chat", ChatSchema);

// 🔍 GET → traer chats
export async function GET() {
  await dbConnect();

  const chats = await Chat.find().sort({ creadoEn: -1 });

  return NextResponse.json(chats);
}

// 💾 POST → guardar chat
export async function POST(req: Request) {
  const { mensajes } = await req.json();

  await dbConnect();

  const nuevoChat = new Chat({ mensajes });
  await nuevoChat.save();

  return NextResponse.json({ ok: true });
}