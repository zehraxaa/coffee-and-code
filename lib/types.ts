export type OrderStatus = "received" | "preparing" | "ready" | "completed" | "cancelled"

export interface Campaign {
  id: string
  title: string
  description: string
  /** ISO string — computed from endDate + endTime */
  expiresAt: string
  /** Date range: "YYYY-MM-DD" */
  startDate?: string
  endDate?: string
  /** Time range: "HH:MM" (24h) */
  startTime?: string
  endTime?: string
  /**
   * Days of week the discount is active (0 = Sunday … 6 = Saturday).
   * Empty / undefined means every day.
   */
  activeDays?: number[]
  /** Array of menu item IDs this discount applies to */
  applicableItemIds: string[]
  discountPercent: number
  /** Display order in the customer-facing carousel (lower = first) */
  sortOrder?: number
  /** base64 data URL or relative /images/... path */
  imageUrl?: string
  createdAt: string
}

/** Standalone splash/opening banner image managed from barista panel */
export interface SplashImage {
  /** base64 data URL */
  url: string
  updatedAt: string
}

/** Coffee of the Month — set by barista */
export interface CoffeeOfMonth {
  name: string
  description: string
  origin: string
  imageUrl?: string
  updatedAt: string
}

export interface Order {
  id: string
  timestamp: Date
  orderNumber?: number
  itemName?: string
  coffeeStrength: "smooth" | "balanced" | "strong" | "light" | "dark"
  sugarLevel: number
  shot: "single" | "double"
  milkType?: "whole" | "lactose-free" | "oat"
  cupType: "paper" | "plastic" | "glass" | "porcelain"
  cupSize: "small" | "medium" | "large"
  syrups: string[]
  chocolateType?: "white" | "milk" | "dark"
  isGuest?: boolean
  /** Logged-in user UUID or a guest session ID (prefixed "guest_") */
  userId?: string
  status: OrderStatus
  rating?: number
  review?: string
  reviewerName?: string
  price?: string
  note?: string
}
