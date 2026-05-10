// ─────────────────────────────────────────────────────────────────
// 📸 Tüm kahve görsellerinin merkezi haritası
//    key  → menu-items.ts'deki item.id değeri
//    value → /public/images/ altındaki dosya yolu
//
// Bu dosya tüm bileşenler tarafından import edilir:
//   - menu-view.tsx       (menü kartları)
//   - home-view.tsx       (customer favorites)
//   - activity-view.tsx   (sipariş geçmişi)
//   - custom-order-form.tsx (sipariş özelleştirme hero image)
//   - barista/page.tsx    (list of orders kategori kartları)
//
// Yeni kahve fotoğrafı eklemek için:
//   1. Görseli /public/images/ klasörüne koy
//   2. Aşağıdaki haritaya id → yol ekle
// ─────────────────────────────────────────────────────────────────

export const COFFEE_IMAGES: Record<string, string> = {
  "latte":              "/images/latte-hero.png",
  "spanish-latte":      "/images/spanish-latte.png",
  "americano":          "/images/americano.jpeg",
  "cappuccino":         "/images/cappuccino.jpg",
  "mocha":              "/images/mocha.png",
  "espresso":           "/images/espresso.jpg",
  "tea":                "/images/tea.jpg",
  "iced-latte":         "/images/iced-latte.jpg",
  "iced-spanish-latte": "/images/iced-spanish-latte.jpg",
  "iced-americano":     "/images/Iced-Americano.jpg",
  "cold-brew":          "/images/cold-brew.png",
  "iced-mocha":         "/images/iced-mocha.jpg",
}

/**
 * Kahve adına göre görsel yolunu döndürür.
 * Önce tam eşleşme dener, bulamazsa küçük harfe çevirip slug'a dönüştürür.
 * Görsel yoksa undefined döner.
 */
export function getCoffeeImage(itemName: string): string | undefined {
  // Doğrudan id ile eşleşme (menu-items.ts'deki id)
  if (COFFEE_IMAGES[itemName]) return COFFEE_IMAGES[itemName]

  // İsimden slug oluştur: "Iced Latte" → "iced-latte"
  const slug = itemName.toLowerCase().replace(/\s+/g, "-")
  return COFFEE_IMAGES[slug]
}
