"use client"

import Link from "next/link"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isClickable = !!item.href

        return (
          <div key={index} className="flex items-center space-x-2">
            {isClickable ? (
              <Link
                href={item.href!}
                className={`hover:text-blue-600 hover:underline transition-colors duration-200 cursor-pointer ${isLast ? "text-gray-800 font-medium" : ""
                  }`}
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-gray-800 font-medium" : ""}>
                {item.label}
              </span>
            )}

            {/* Separator */}
            {index < items.length - 1 && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
        )
      })}
    </nav>
  )
}
