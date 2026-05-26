import { supabase } from "@/lib/supabase"

/**
 * Sipariş numarası üretir.
 * Format: YYMMDD + 3 haneli günlük sıra → 260526001, 260526002, ...
 * Supabase'den bugünkü sipariş sayısını sorgular.
 * Hata olursa localStorage fallback kullanır.
 */
export async function getNextOrderNumber(): Promise<number> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const datePrefix = `${yy}${mm}${dd}` // "260526"

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  let dailyCount = 0

  try {
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart)

    if (!error && count !== null) {
      dailyCount = count
    } else {
      // Supabase sorgusu başarısızsa localStorage fallback
      dailyCount = getLocalCount(datePrefix)
    }
  } catch {
    dailyCount = getLocalCount(datePrefix)
  }

  const seq = dailyCount + 1

  // localStorage'ı güncelle (fallback ve tutarlılık için)
  saveLocalCount(datePrefix, seq)

  // "260526" + "001" → 260526001
  const seqStr = String(seq).padStart(3, "0")
  return Number(`${datePrefix}${seqStr}`)
}

/**
 * Sipariş numarasını gösterim formatına çevirir.
 * 260526001 → "#260526001"
 * Eski kısa numaralar: 2 → "#002"
 */
export function formatOrderNumber(num?: number): string {
  if (!num) return "#---"
  const s = String(num)
  if (s.length >= 9) return `#${s}`
  return `#${s.padStart(3, "0")}`
}

// ── localStorage yardımcıları ─────────────────────────────────────────────
const STORAGE_KEY = "coffee_order_daily_counter"

function getLocalCount(datePrefix: string): number {
  if (typeof window === "undefined") return 0
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const { prefix, count } = JSON.parse(stored)
      if (prefix === datePrefix) return count
    }
  } catch { /* ignore */ }
  return 0
}

function saveLocalCount(datePrefix: string, count: number): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ prefix: datePrefix, count }))
  } catch { /* ignore */ }
}
