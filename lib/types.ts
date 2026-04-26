export type OrderStatus = "received" | "preparing" | "ready" | "completed"

export interface Order {
  id: string
  timestamp: Date
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
  price?: string
}
