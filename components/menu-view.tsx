"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const hotMenuItems: MenuItem[] = [
    {
      id: "spanish-latte",
      name: "Spanish Latte",
      description: "Sweet and creamier flavour, our special recipe",
      price: "120 TL",
      popular: true,
    },
    {
      id: "latte",
      name: "Latte",
      description: "Espresso with steamed milk and light foam",
      price: "100 TL",
      popular: true,
    },
    {
      id: "americano",
      name: "Americano",
      description: "Espresso with hot water",
      price: "100 TL",
    },
    {
      id: "cappuccino",
      name: "Cappuccino",
      description: "Equal parts espresso, steamed milk, and foam",
      price: "100 TL",
    },
    {
      id: "mocha",
      name: "Mocha",
      description: "Espresso with chocolate and steamed milk",
      price: "100 TL",
    },
    {
      id: "espresso",
      name: "Espresso",
      description: "Classic Italian coffee shot",
      price: "100 TL",
    },
  ]

  const icedMenuItems: MenuItem[] = [
    {
      id: "iced-spanish-latte",
      name: "Iced Spanish Latte",
      description: "Sweet and refreshing creamier flavour over ice",
      price: "130 TL",
      popular: true,
    },
    {
      id: "iced-latte",
      name: "Iced Latte",
      description: "Espresso with cold milk poured over ice",
      price: "110 TL",
    },
    {
      id: "iced-americano",
      name: "Iced Americano",
      description: "Espresso with cold water and ice",
      price: "110 TL",
    },
    {
      id: "cold-brew",
      name: "Cold Brew",
      description: "Smooth, slowly steeped cold coffee",
      price: "120 TL",
      popular: true,
    },
    {
      id: "iced-mocha",
      name: "Iced Mocha",
      description: "Espresso with chocolate and cold milk over ice",
      price: "120 TL",
    },
  ]

  const renderMenuItems = (items: MenuItem[]) => (
    <div className="grid grid-cols-2 gap-4 pb-6 mt-6">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col p-4 text-center border-border/50">
          <div className="mb-3 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Coffee className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="flex flex-1 flex-col">
            <h3 className="text-md font-semibold text-foreground">{item.name}</h3>
            {item.popular && (
              <div className="my-1">
                <Badge variant="secondary" className="text-[10px]">
                  Popular
                </Badge>
              </div>
            )}
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
            <div className="mt-auto pt-3">
              <p className="mb-2 text-lg font-bold text-primary">{item.price}</p>
              <Button
                size="sm"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => onSelectItem(item)}
              >
                Order
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

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
      <Tabs defaultValue="hot" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hot">Hot Drinks</TabsTrigger>
          <TabsTrigger value="iced">Ice Drinks</TabsTrigger>
        </TabsList>

        <TabsContent value="hot">
          {renderMenuItems(hotMenuItems)}
        </TabsContent>

        <TabsContent value="iced">
          {renderMenuItems(icedMenuItems)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
