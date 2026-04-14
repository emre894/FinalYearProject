// web/app/api/exports/route.ts
import { connectMongo } from "@/lib/mongoose";
import Export from "@/models/Export";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

// Validation schema for POST request body
const PostBodySchema = z.object({
  batchId: z.string().min(1),
  type: z.literal("manual"), // Only "manual" type for now
  filename: z.string().min(1),
  csvContent: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    // Check if user is logged in
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const json = await request.json();
    const parsed = PostBodySchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          message: "Invalid request body",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectMongo();

    // Create export document with userId from session (cannot be spoofed)
    const exportDoc = new Export({
      userId: session.user.id, // Attach userId from session for security
      batchId: parsed.data.batchId,
      type: parsed.data.type,
      filename: parsed.data.filename,
      csvContent: parsed.data.csvContent,
    });

    // Save to MongoDB
    await exportDoc.save();

    return Response.json({ ok: true });
  } catch (err: any) {
    // Log error but don't expose sensitive details
    console.error("Export error:", err.message);
    return Response.json(
      { ok: false, message: "Failed to save export" },
      { status: 500 }
    );
  }
}
