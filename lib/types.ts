export type OrderStatus = "received" | "preparing" | "ready" | "completed" | "cancelled"

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
  syrups: string[]
  chocolateType?: "white" | "milk" | "dark"
  isGuest?: boolean
  status: OrderStatus
  rating?: number
  review?: string
  reviewerName?: string
  price?: string
}
