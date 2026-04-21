import { NextRequest } from "next/server";

const ML_API_URL = process.env.ML_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    const mlResponse = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });

    if (!mlResponse.ok) {
      return Response.json({ category: null }, { status: 200 });
    }

    const data = await mlResponse.json();
    return Response.json({ category: data.predicted_category ?? null });
  } catch {
    return Response.json({ category: null }, { status: 200 });
  }
}