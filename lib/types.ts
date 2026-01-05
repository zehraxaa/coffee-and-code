export type OrderStatus = "received" | "preparing" | "ready"

export interface Order {
  id: string
  timestamp: Date
  itemName?: string
  coffeeStrength: number
  sugarLevel: number
  shot: "single" | "double"
  milkType: "whole" | "lactose-free" | "oat"
  cupType: "paper" | "glass" | "porcelain"
  syrups: string[]
  status: OrderStatus
  rating?: number
  review?: string
  price?: string
}
