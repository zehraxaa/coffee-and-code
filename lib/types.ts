export type OrderStatus = "received" | "preparing" | "ready" | "completed" | "cancelled"

export interface Campaign {
  id: string
  title: string
  description: string
  /** ISO string */
  expiresAt: string
  /** Array of menu item IDs this discount applies to */
  applicableItemIds: string[]
  discountPercent: number
  /** base64 data URL or relative /images/... path */
  imageUrl?: string
  /** Whether to show this image on the splash/promo screen */
  showOnSplash: boolean
  createdAt: string
}

export interface Order {
  id: string
  timestamp: Date
  orderNumber?: number
  itemName?: string
  coffeeStrength: "smooth" | "balanced" | "strong"
  sugarLevel: number
  shot: "single" | "double"
  milkType: "whole" | "lactose-free" | "oat"
  cupType: "paper" | "plastic" | "glass" | "porcelain"
  cupSize: "small" | "medium" | "large"
  syrups: string[]
  chocolateType?: "white" | "milk" | "dark"
  isGuest?: boolean
  status: OrderStatus
  rating?: number
  review?: string
  reviewerName?: string
  price?: string
  note?: string
}
