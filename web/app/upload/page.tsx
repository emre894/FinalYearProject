// web/app/upload/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Nav from "@/app/components/Nav";
import Link from "next/link";

export default async function UploadPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload</h1>

          {/* User info */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Logged in as:</p>
            <p className="font-medium text-gray-900">{session.user?.email}</p>
          </div>

          {/* Choose input method */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Choose input method
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CSV Upload option */}
              <Link
                href="/upload/csv"
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload CSV
                </h3>
                <p className="text-sm text-gray-600">
                  Upload a CSV file with your transactions
                </p>
              </Link>

              {/* Manual Entry option */}
              <Link
                href="/upload/manual"
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Manual Entry
                </h3>
                <p className="text-sm text-gray-600">
                  Enter transactions manually using a step-by-step wizard
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
