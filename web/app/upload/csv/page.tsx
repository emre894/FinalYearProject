// web/app/upload/csv/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Nav from "@/app/components/Nav";
import UploadClient from "../UploadClient";

export default async function CSVUploadPage() {
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

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Render client component for CSV upload UI */}
          <UploadClient
            userEmail={session.user?.email || ""}
            userId={session.user?.id || ""}
          />
        </div>
      </div>
    </div>
  );
}
