"use client";

import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Define the navigation links for the app
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/insights", label: "AI Insights" },
  { href: "/forecast", label: "Forecast" },
  { href: "/patterns", label: "Patterns" },
  { href: "/reports", label: "Reports" },
  { href: "/upload", label: "Upload" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">AI Budgeting App</h1>
          </div>

          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(href)
                    ? "text-blue-700 bg-blue-50 underline"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {session?.user?.email && (
              <span className="text-sm text-gray-600">{session.user.email}</span>
            )}

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}