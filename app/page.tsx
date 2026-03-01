import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
      <h1 className="text-5xl font-bold text-[#0B1F3A] mb-6">Finquara</h1>

      <p className="text-xl text-gray-600 mb-8">
        The Global Finance & Risk Talent Network
      </p>

      <div className="flex gap-4">
        <Link
          href="/jobs"
          className="px-6 py-3 bg-[#2563EB] text-white rounded-lg text-lg hover:opacity-90"
        >
          Find Jobs
        </Link>

        <Link
          href="/post"
          className="px-6 py-3 border border-[#2563EB] text-[#2563EB] rounded-lg text-lg hover:bg-blue-50"
        >
          Post a Job
        </Link>
      </div>

      <p className="mt-10 text-gray-400 text-sm">
        Starting with Actuarial Careers in Korea
      </p>
    </main>
  );
}