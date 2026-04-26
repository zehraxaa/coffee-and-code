const STORAGE_KEY = "coffee_order_daily_counter"

export function getNextOrderNumber(): number {
  if (typeof window === "undefined") return 1
  const today = new Date().toISOString().split("T")[0]
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const { date, count } = JSON.parse(stored) as { date: string; count: number }
      if (date === today) {
        const next = count + 1
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: next }))
        return next
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 1 }))
    return 1
  } catch {
    return 1
  }
}

export function formatOrderNumber(num?: number): string {
  if (!num) return "#---"
  return `#${String(num).padStart(3, "0")}`
}
