// web/app/upload/manual/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Nav from "@/app/components/Nav";
import ManualEntryClient from "./ManualEntryClient";

export default async function ManualEntryPage() {
  // Get session on server side
  const session = await getServerSession(authOptions);

  // If not authenticated, redirect to login (middleware should handle this, but double-check)
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Nav />

      {/* Main content - full screen wizard */}
      <ManualEntryClient userEmail={session.user?.email || ""} />
    </div>
  );
}
