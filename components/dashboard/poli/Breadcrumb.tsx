import Link from "next/link"
interface BreadcrumbProps {
  items: string[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm text-gray-500 mb-6 space-x-2">
      {items.map((item, i) => (
        <span key={i}>{item}</span>
      ))}
    </nav>
  );
}

