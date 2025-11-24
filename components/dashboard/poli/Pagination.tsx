"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (
      i <= 3 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={idx} className="px-2">...</span>
        ) : (
          <button
            key={idx}
            onClick={() => onChange(p as number)}
            className={`px-3 py-1 border rounded ${
              p === currentPage ? "bg-blue-600 text-white" : ""
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
