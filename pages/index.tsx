import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Welcome to SIMRS</h1>
      <p>Hellow world</p>
      <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
    </div>
  );
}
