// lib/shared/utils.ts
export function getFormattedDateTime() {
    const now = new Date()

    const dateString = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    })

    const timeString = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })

    return {
        dateString,
        timeString,
    }
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount)
}

export function formatDate(date: string | Date, format: "short" | "long" = "short"): string {
    const d = typeof date === "string" ? new Date(date) : date

    if (format === "long") {
        return d.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        })
    }

    return d.toLocaleDateString("id-ID")
}

export function calculateAge(birthDate: string | Date): number {
    const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
    }

    return age
}
