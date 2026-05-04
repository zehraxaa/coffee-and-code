export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  popular?: boolean
  category: "hot" | "iced"
  /** Calculated fields */
  originalPrice?: number
  discountPercent?: number
}

export const HOT_MENU_ITEMS: MenuItem[] = [
  {
    id: "spanish-latte",
    name: "Spanish Latte",
    description: "Sweet and creamier flavour, our special recipe",
    price: 120,
    popular: true,
    category: "hot",
  },
  {
    id: "latte",
    name: "Latte",
    description: "Espresso with steamed milk and light foam",
    price: 100,
    popular: true,
    category: "hot",
  },
  {
    id: "americano",
    name: "Americano",
    description: "Espresso with hot water",
    price: 100,
    category: "hot",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Equal parts espresso, steamed milk, and foam",
    price: 100,
    category: "hot",
  },
  {
    id: "mocha",
    name: "Mocha",
    description: "Espresso with chocolate and steamed milk",
    price: 100,
    category: "hot",
  },
  {
    id: "espresso",
    name: "Espresso",
    description: "Classic Italian coffee shot",
    price: 100,
    category: "hot",
  },
]

export const ICED_MENU_ITEMS: MenuItem[] = [
  {
    id: "iced-spanish-latte",
    name: "Iced Spanish Latte",
    description: "Sweet and refreshing creamier flavour over ice",
    price: 130,
    popular: true,
    category: "iced",
  },
  {
    id: "iced-latte",
    name: "Iced Latte",
    description: "Espresso with cold milk poured over ice",
    price: 110,
    category: "iced",
  },
  {
    id: "iced-americano",
    name: "Iced Americano",
    description: "Espresso with cold water and ice",
    price: 110,
    category: "iced",
  },
  {
    id: "cold-brew",
    name: "Cold Brew",
    description: "Smooth, slowly steeped cold coffee",
    price: 120,
    popular: true,
    category: "iced",
  },
  {
    id: "iced-mocha",
    name: "Iced Mocha",
    description: "Espresso with chocolate and cold milk over ice",
    price: 120,
    category: "iced",
  },
]

export const ALL_MENU_ITEMS: MenuItem[] = [...HOT_MENU_ITEMS, ...ICED_MENU_ITEMS]

/** item adından ID bul (case-insensitive) */
export function getMenuItemIdByName(name: string): string | undefined {
  return ALL_MENU_ITEMS.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  )?.id
}

/** item ID'den MenuItem bul */
export function getMenuItemById(id: string): MenuItem | undefined {
  return ALL_MENU_ITEMS.find((item) => item.id === id)
}
