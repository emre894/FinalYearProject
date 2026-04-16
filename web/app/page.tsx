// web/app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/upload");

  return (
    <div
      style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #ede9ff 100%)" }}
      className="flex items-center justify-center px-4 relative overflow-hidden"
    >

      {/* Background blur circles */}
      <div style={{
        position: "absolute", top: "-80px", left: "-80px",
        width: "320px", height: "320px",
        background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        borderRadius: "50%"
      }} />
      <div style={{
        position: "absolute", bottom: "-80px", right: "-80px",
        width: "320px", height: "320px",
        background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
        borderRadius: "50%"
      }} />

      {/* Top-left floating card */}
      <div style={{
        position: "absolute", top: "80px", left: "120px",
        transform: "rotate(-6deg)", opacity: 0.75,
        width: "180px"
      }} className="bg-white rounded-xl shadow-lg p-4 hidden lg:block">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Spent</p>
        <p className="text-xl font-bold text-red-500">£1,741.77</p>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
          <div className="h-1.5 bg-red-400 rounded-full" style={{ width: "72%" }} />
        </div>
      </div>

      {/* Top-right floating card */}
      <div style={{
        position: "absolute", top: "80px", right: "120px",
        transform: "rotate(5deg)", opacity: 0.75,
        width: "168px"
      }} className="bg-white rounded-xl shadow-lg p-4 hidden lg:block">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net Balance</p>
        <p className="text-xl font-bold text-green-600">£1,042.82</p>
        <p className="text-xs text-gray-400 mt-1">Within budget</p>
      </div>

      {/* Bottom-left floating card */}
      <div style={{
        position: "absolute", bottom: "80px", left: "120px",
        transform: "rotate(4deg)", opacity: 0.75,
        width: "196px"
      }} className="bg-white rounded-xl shadow-lg p-4 hidden lg:block">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">By Category</p>
        <div className="space-y-1.5">
          {[
            { label: "Housing", pct: 33, color: "#818cf8" },
            { label: "Groceries", pct: 17, color: "#a78bfa" },
            { label: "Transport", pct: 8, color: "#60a5fa" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                <span>{item.label}</span>
                <span>{item.pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${item.pct * 2.5}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom-right floating card */}
      <div style={{
        position: "absolute", bottom: "80px", right: "120px",
        transform: "rotate(-4deg)", opacity: 0.75,
        width: "168px"
      }} className="bg-white rounded-xl shadow-lg p-4 hidden lg:block">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Next Month</p>
        <p className="text-xl font-bold text-purple-600">£1,617</p>
        <p className="text-xs text-gray-400 mb-2">WMA Forecast</p>
        <div className="flex gap-1 items-end" style={{ height: "32px" }}>
          {[40, 55, 48, 62, 70, 80].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                backgroundColor: i === 5 ? "#7c3aed" : "#ddd6fe"
              }}
            />
          ))}
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full" style={{ maxWidth: "440px" }}>
        <div
          className="bg-white rounded-2xl p-8 text-center"
          style={{ boxShadow: "0 20px 60px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.06)" }}
        >

          {/* Logo icon */}
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
            style={{ background: "#4f46e5" }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>

          {/* App name */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            SpendSight
          </h1>

          {/* Tagline */}
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#4f46e5" }}
          >
            AI-Driven Budgeting
          </p>

          {/* Description */}
          <p
            className="text-gray-500 text-sm mb-5 leading-relaxed mx-auto"
            style={{ maxWidth: "320px" }}
          >
            Upload your transactions, understand your spending habits, and get
            personalised AI insights to help you budget smarter.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["Smart Categorisation", "Spending Forecasts", "AI Insights"].map((f) => (
              <span
                key={f}
                className="px-3 py-1.5 text-xs font-medium rounded-full"
                style={{ background: "#eef2ff", color: "#4338ca", border: "1px solid #e0e7ff" }}
              >
                {f}
              </span>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-2">
            <Link
              href="/login"
              className="w-full sm:w-40 px-6 py-3 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95 text-center"
              style={{ background: "#4f46e5" }}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-40 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:bg-indigo-50 shadow-sm hover:shadow-md active:scale-95 text-center"
              style={{ background: "white", color: "#4f46e5", border: "2px solid #e0e7ff" }}
            >
              Register
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}