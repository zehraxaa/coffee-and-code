"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coffee, ArrowLeft } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  price: string
  popular?: boolean
}

interface MenuViewProps {
  onBack: () => void
  onSelectItem: (item: MenuItem) => void
}

export function MenuView({ onBack, onSelectItem }: MenuViewProps) {
  const menuItems: MenuItem[] = [
    {
      id: "latte",
      name: "Latte",
      description: "Espresso with steamed milk and light foam",
      price: "$4.50",
      popular: true,
    },
    {
      id: "americano",
      name: "Americano",
      description: "Espresso with hot water",
      price: "$3.50",
    },
    {
      id: "cappuccino",
      name: "Cappuccino",
      description: "Equal parts espresso, steamed milk, and foam",
      price: "$4.00",
      popular: true,
    },
    {
      id: "mocha",
      name: "Mocha",
      description: "Espresso with chocolate and steamed milk",
      price: "$5.00",
    },
    {
      id: "espresso",
      name: "Espresso",
      description: "Classic Italian coffee shot",
      price: "$3.00",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu</h1>
          <p className="text-sm text-muted-foreground">Choose your favorite</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-4 pb-6">
        {menuItems.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Coffee className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                    {item.popular && (
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-2 text-lg font-bold text-primary">{item.price}</p>
                </div>
              </div>
            </div>
            <Button
              className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onSelectItem(item)}
            >
              Customize & Order
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
