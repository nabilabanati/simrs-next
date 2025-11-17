import Link from "next/link";

export default function Loket() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Loket</h1>
      <p>Hellow</p>
      <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
    </div>
  );
}
