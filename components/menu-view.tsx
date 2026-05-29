"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coffee, ArrowLeft, Loader2 } from "lucide-react"
import { useBroadcastCampaigns } from "@/hooks/use-broadcast-campaigns"
import { useMenuItems } from "@/hooks/use-menu-items"
import type { MenuItem } from "@/lib/menu-items"
import { COFFEE_IMAGES } from "@/lib/coffee-images"

interface MenuViewProps {
  onBack: () => void
  onSelectItem: (item: { name: string; price: string }) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

export function MenuView({ onBack, onSelectItem, selectedCategory = "hot", onCategoryChange }: MenuViewProps) {
  const { applyDiscount } = useBroadcastCampaigns()
  const { menuItems, loading } = useMenuItems()

  const hotMenuItems: MenuItem[] = menuItems
    .filter((item) => item.category === "hot")
    .map((item) => {
      const discounted = applyDiscount(item.price, item.id)
      return {
        ...item,
        originalPrice: item.price,
        price: discounted.finalPrice,
        discountPercent: discounted.discount > 0 ? Math.round((discounted.discount / item.price) * 100) : 0,
      }
    })

  const icedMenuItems: MenuItem[] = menuItems
    .filter((item) => item.category === "iced")
    .map((item) => {
      const discounted = applyDiscount(item.price, item.id)
      return {
        ...item,
        originalPrice: item.price,
        price: discounted.finalPrice,
        discountPercent: discounted.discount > 0 ? Math.round((discounted.discount / item.price) * 100) : 0,
      }
    })

  const renderMenuItems = (items: MenuItem[]) => (
    <div className="grid grid-cols-2 gap-4 pb-6 mt-6">
      {items.map((item) => {
        // Prefer DB image_url, then COFFEE_IMAGES map by id, then name slug
        const itemImage =
          item.imageUrl ||
          COFFEE_IMAGES[item.id] ||
          COFFEE_IMAGES[item.name.toLowerCase().replace(/\s+/g, "-")]
        return (
          <Card key={item.id} className="flex flex-col p-4 text-center border-border/50">
            <div className="mb-3 flex justify-center">
              {itemImage ? (
                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20">
                  <Image
                    src={itemImage}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Coffee className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
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
              {item.isNew && (
                <div className="my-1">
                  <Badge className="text-[10px] bg-emerald-500 hover:bg-emerald-500 text-white">
                    New
                  </Badge>
                </div>
              )}
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
              <div className="mt-auto pt-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {item.discountPercent && item.discountPercent > 0 ? (
                    <>
                      <span className="text-xs line-through text-muted-foreground">{item.originalPrice} TL</span>
                      <span className="text-lg font-bold text-destructive">{item.price} TL</span>
                      <Badge variant="destructive" className="text-[10px]">
                        -{item.discountPercent}%
                      </Badge>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-primary">{item.price} TL</span>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => onSelectItem({ name: item.name, price: `${item.price} TL` })}
                >
                  Order
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
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

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs value={selectedCategory} onValueChange={(val) => onCategoryChange?.(val)} className="w-full">
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
      )}
    </div>
  )
}
