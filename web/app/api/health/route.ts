import { connectMongo } from "@/lib/mongoose";

export async function GET() {
  try {
    await connectMongo();
    return Response.json({ ok: true, db: "connected" });
  } catch (err: any) {
    return Response.json(
      { ok: false, db: "error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
