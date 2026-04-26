"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Coffee, X } from "lucide-react"
import type { Order } from "@/lib/types"

interface CustomOrderFormProps {
  onBack: () => void
  onPlaceOrder: (order: Omit<Order, "id" | "timestamp">) => void
  preselectedItem?: { name: string; price: string }
}

// Süt ve syrup gerektirmeyen içecekler
const NO_MILK_ITEMS = ["americano", "espresso", "Americano", "Espresso", "Iced Americano"]
const MOCHA_ITEMS = ["mocha", "Mocha", "Iced Mocha"]

function isNoMilkItem(name?: string) {
  if (!name) return false
  return NO_MILK_ITEMS.some((n) => name.toLowerCase().includes(n.toLowerCase()))
}

function isMochaItem(name?: string) {
  if (!name) return false
  return MOCHA_ITEMS.some((n) => name.toLowerCase().includes(n.toLowerCase()))
}

function isIcedItem(name?: string) {
  if (!name) return false
  return name.toLowerCase().includes("iced") || name.toLowerCase().includes("cold")
}

interface OrderConfirmPopupProps {
  order: Omit<Order, "id" | "timestamp">
  itemName: string
  price: string
  onConfirm: () => void
  onCancel: () => void
}

function OrderConfirmPopup({ order, itemName, price, onConfirm, onCancel }: OrderConfirmPopupProps) {
  const sugarLabel = (v: number) => {
    if (v === 0) return "No Sugar"
    if (v === 1) return "Very Light"
    if (v === 2) return "Light"
    if (v === 3) return "Medium"
    if (v === 4) return "Sweet"
    return "Extra Sweet"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Popup */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-xl font-bold text-foreground">Order Summary</h2>
            <p className="text-sm text-muted-foreground">Please review your order</p>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Order details */}
        <div className="px-6 py-4 space-y-3">
          {/* Coffee name */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Coffee className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{itemName}</p>
              <p className="text-xs text-muted-foreground">{order.shot} shot</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Strength</p>
              <p className="font-medium text-foreground capitalize">{order.coffeeStrength}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Sugar</p>
              <p className="font-medium text-foreground">
                {order.sugarLevel}/5 · {sugarLabel(order.sugarLevel)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Cup Type</p>
              <p className="font-medium text-foreground capitalize">{order.cupType}</p>
            </div>
            {order.milkType && !isNoMilkItem(order.itemName) && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Milk</p>
                <p className="font-medium text-foreground capitalize">{order.milkType}</p>
              </div>
            )}
            {order.chocolateType && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Chocolate</p>
                <p className="font-medium text-foreground capitalize">{order.chocolateType}</p>
              </div>
            )}
            {order.syrups && order.syrups.length > 0 && (
              <div className="p-3 rounded-xl bg-muted/50 col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Syrups</p>
                <p className="font-medium text-foreground">{order.syrups.join(", ")}</p>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">{price}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <Button
            variant="outline"
            className="flex-1 border-border text-foreground"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onConfirm}
          >
            <Coffee className="mr-2 h-4 w-4" />
            Confirm Order
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CustomOrderForm({ onBack, onPlaceOrder, preselectedItem }: CustomOrderFormProps) {
  const [coffeeStrength, setCoffeeStrength] = useState<"smooth" | "balanced" | "strong">("balanced")
  const [sugarLevel, setSugarLevel] = useState([0])
  const [shot, setShot] = useState<"single" | "double">("single")
  const [milkType, setMilkType] = useState<"whole" | "lactose-free" | "oat">("whole")
  const [cupType, setCupType] = useState<"paper" | "plastic" | "glass" | "porcelain">(
    isIcedItem(preselectedItem?.name) ? "plastic" : "paper"
  )
  const [syrups, setSyrups] = useState<string[]>([])
  const [chocolateType, setChocolateType] = useState<"white" | "milk" | "dark">("milk")
  const [showConfirm, setShowConfirm] = useState(false)

  const noMilk = isNoMilkItem(preselectedItem?.name)
  const isMocha = isMochaItem(preselectedItem?.name)
  const isIced = isIcedItem(preselectedItem?.name)

  const availableSyrups = ["Vanilla", "Caramel", "Hazelnut", "Lotus", "Peppermint"]

  const toggleSyrup = (syrup: string) => {
    setSyrups((prev) => (prev.includes(syrup) ? prev.filter((s) => s !== syrup) : [...prev, syrup]))
  }

  const calculatePrice = (): string => {
    return preselectedItem?.price || "100 TL"
  }

  const buildOrder = (): Omit<Order, "id" | "timestamp"> => ({
    itemName: preselectedItem?.name,
    coffeeStrength,
    sugarLevel: sugarLevel[0],
    shot,
    milkType,
    cupType,
    syrups: noMilk ? [] : syrups,
    chocolateType: isMocha ? chocolateType : undefined,
    status: "received",
    price: calculatePrice(),
  })

  const handlePlaceOrderClick = () => {
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    setShowConfirm(false)
    onPlaceOrder(buildOrder())
  }

  const handleCancel = () => {
    setShowConfirm(false)
    onBack()
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {preselectedItem ? `Customize ${preselectedItem.name}` : "Custom Order"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {preselectedItem ? preselectedItem.price : "Craft your perfect drink"}
            </p>
          </div>
        </div>

        <div className="space-y-6 pb-6">
          {/* Coffee Strength */}
          <Card className="p-6">
            <Label className="text-base font-semibold text-foreground">Coffee Strength</Label>
            <p className="mt-1 text-sm text-muted-foreground">How intense do you want it?</p>
            <div className="mt-4 flex gap-3">
              <Button
                variant={coffeeStrength === "smooth" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setCoffeeStrength("smooth")}
              >
                Smooth
              </Button>
              <Button
                variant={coffeeStrength === "balanced" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setCoffeeStrength("balanced")}
              >
                Balanced
              </Button>
              <Button
                variant={coffeeStrength === "strong" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setCoffeeStrength("strong")}
              >
                Strong
              </Button>
            </div>
          </Card>

          {/* Sugar Level */}
          <Card className="p-6">
            <Label className="text-base font-semibold text-foreground">Sugar Level</Label>
            <p className="mt-1 text-sm text-muted-foreground">Level: {sugarLevel[0]}/5</p>
            <div className="mt-4">
              <Slider value={sugarLevel} onValueChange={setSugarLevel} max={5} min={0} step={1} className="w-full" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>No Sugar</span>
              <span>Extra Sweet</span>
            </div>
          </Card>

          {/* Shot Type */}
          <Card className="p-6">
            <Label className="text-base font-semibold text-foreground">Espresso Shot</Label>
            <div className="mt-4 flex gap-3">
              <Button
                variant={shot === "single" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setShot("single")}
              >
                Single
              </Button>
              <Button
                variant={shot === "double" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setShot("double")}
              >
                Double
              </Button>
            </div>
          </Card>

          {/* Milk Type — Americano ve Espresso için gizle */}
          {!noMilk && (
            <Card className="p-6">
              <Label className="text-base font-semibold text-foreground">Milk Type</Label>
              <div className="mt-4 flex gap-3">
                <Button
                  variant={milkType === "whole" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setMilkType("whole")}
                >
                  Whole
                </Button>
                <Button
                  variant={milkType === "lactose-free" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setMilkType("lactose-free")}
                >
                  Lactose-Free
                </Button>
                <Button
                  variant={milkType === "oat" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setMilkType("oat")}
                >
                  Oat
                </Button>
              </div>
            </Card>
          )}

          {/* Cup Type */}
          <Card className="p-6">
            <Label className="text-base font-semibold text-foreground">Cup Type</Label>
            <div className="mt-4 flex gap-3">
              {isIced ? (
                // Soğuk içecekler: sadece Plastic ve Glass
                <>
                  <Button
                    variant={cupType === "plastic" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setCupType("plastic")}
                  >
                    Plastic
                  </Button>
                  <Button
                    variant={cupType === "glass" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setCupType("glass")}
                  >
                    Glass
                  </Button>
                </>
              ) : (
                // Sıcak içecekler: Paper, Glass, Porcelain
                <>
                  <Button
                    variant={cupType === "paper" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setCupType("paper")}
                  >
                    Paper
                  </Button>
                  <Button
                    variant={cupType === "glass" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setCupType("glass")}
                  >
                    Glass
                  </Button>
                  <Button
                    variant={cupType === "porcelain" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setCupType("porcelain")}
                  >
                    Porcelain
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Chocolate Type — sadece Mocha için */}
          {isMocha && (
            <Card className="p-6">
              <Label className="text-base font-semibold text-foreground">Chocolate Type</Label>
              <p className="mt-1 text-sm text-muted-foreground">Choose your chocolate</p>
              <div className="mt-4 flex gap-3">
                <Button
                  variant={chocolateType === "white" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setChocolateType("white")}
                >
                  White
                </Button>
                <Button
                  variant={chocolateType === "milk" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setChocolateType("milk")}
                >
                  Milk
                </Button>
                <Button
                  variant={chocolateType === "dark" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setChocolateType("dark")}
                >
                  Dark
                </Button>
              </div>
            </Card>
          )}

          {/* Syrups — Americano ve Espresso için gizle */}
          {!noMilk && (
            <Card className="p-6">
              <Label className="text-base font-semibold text-foreground">Add Syrups</Label>
              <p className="mt-1 text-sm text-muted-foreground">Select multiple</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {availableSyrups.map((syrup) => (
                  <Badge
                    key={syrup}
                    variant={syrups.includes(syrup) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2"
                    onClick={() => toggleSyrup(syrup)}
                  >
                    {syrup}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Place Order Button */}
          <Button
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handlePlaceOrderClick}
          >
            <Coffee className="mr-2 h-5 w-5" />
            Place Order
          </Button>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
        <OrderConfirmPopup
          order={buildOrder()}
          itemName={preselectedItem?.name || "Custom Coffee"}
          price={calculatePrice()}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}
