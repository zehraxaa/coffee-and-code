"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Coffee } from "lucide-react"
import type { Order } from "@/lib/types"

interface CustomOrderFormProps {
  onBack: () => void
  onPlaceOrder: (order: Omit<Order, "id" | "timestamp">) => void
  preselectedItem?: { name: string; price: string }
}

export function CustomOrderForm({ onBack, onPlaceOrder, preselectedItem }: CustomOrderFormProps) {
  const [coffeeStrength, setCoffeeStrength] = useState([5])
  const [sugarLevel, setSugarLevel] = useState([3])
  const [shot, setShot] = useState<"single" | "double">("single")
  const [milkType, setMilkType] = useState<"whole" | "lactose-free" | "oat">("whole")
  const [cupType, setCupType] = useState<"paper" | "glass" | "porcelain">("paper")
  const [syrups, setSyrups] = useState<string[]>([])

  const availableSyrups = ["Vanilla", "Caramel", "Hazelnut", "Mocha", "Peppermint"]

  const toggleSyrup = (syrup: string) => {
    setSyrups((prev) => (prev.includes(syrup) ? prev.filter((s) => s !== syrup) : [...prev, syrup]))
  }

  const calculatePrice = (): string => {
    // Fixed price for all orders
    return "100 TL"
  }

  const handlePlaceOrder = () => {
    const order: Omit<Order, "id" | "timestamp"> = {
      itemName: preselectedItem?.name,
      coffeeStrength: coffeeStrength[0],
      sugarLevel: sugarLevel[0],
      shot,
      milkType,
      cupType,
      syrups,
      status: "received",
      price: calculatePrice(),
    }
    onPlaceOrder(order)
  }

  return (
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
          <p className="mt-1 text-sm text-muted-foreground">Level: {coffeeStrength[0]}/10</p>
          <div className="mt-4">
            <Slider
              value={coffeeStrength}
              onValueChange={setCoffeeStrength}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Mild</span>
            <span>Strong</span>
          </div>
        </Card>

        {/* Sugar Level */}
        <Card className="p-6">
          <Label className="text-base font-semibold text-foreground">Sugar Level</Label>
          <p className="mt-1 text-sm text-muted-foreground">Level: {sugarLevel[0]}/10</p>
          <div className="mt-4">
            <Slider value={sugarLevel} onValueChange={setSugarLevel} max={10} min={0} step={1} className="w-full" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>No Sugar</span>
            <span>Very Sweet</span>
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

        {/* Milk Type */}
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

        {/* Cup Type */}
        <Card className="p-6">
          <Label className="text-base font-semibold text-foreground">Cup Type</Label>
          <div className="mt-4 flex gap-3">
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
          </div>
        </Card>

        {/* Syrups */}
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

        {/* Place Order Button */}
        <Button
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handlePlaceOrder}
        >
          <Coffee className="mr-2 h-5 w-5" />
          Place Order
        </Button>
      </div>
    </div>
  )
}
