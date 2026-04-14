import { connectMongo } from "@/lib/mongoose";
import { Transaction } from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    // Get every unique category name from the user's expense transactions
    const categories = await Transaction.distinct("category", {
      userId: session.user.id,
      amount: { $lt: 0 },
    });

    // Remove any empty values and sort alphabetically
    const sorted = categories.filter(Boolean).sort();

    return Response.json({ ok: true, categories: sorted });
  } catch (err: any) {
    return Response.json(
      { ok: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}