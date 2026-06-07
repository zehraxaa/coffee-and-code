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
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface MenuViewProps {
  onBack: () => void
  onSelectItem: (item: { name: string; price: string }) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

// Ürün adına göre rating ortalaması ve sayısı
type RatingMap = Record<string, { avg: number; count: number }>

export function MenuView({ onBack, onSelectItem, selectedCategory = "hot", onCategoryChange }: MenuViewProps) {
  const { applyDiscount } = useBroadcastCampaigns()
  const { menuItems, loading } = useMenuItems()
  const [ratingMap, setRatingMap] = useState<RatingMap>({})

  // Supabase'den tüm rated siparişleri çek, ürün bazlı grupla
  useEffect(() => {
    const fetchRatings = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("item_name, rating")
        .not("rating", "is", null)

      if (error || !data) return

      const map: Record<string, { total: number; count: number }> = {}
      data.forEach((row: { item_name: string; rating: number }) => {
        if (!row.item_name || !row.rating) return
        const key = row.item_name.toLowerCase()
        if (!map[key]) map[key] = { total: 0, count: 0 }
        map[key].total += row.rating
        map[key].count += 1
      })

      const result: RatingMap = {}
      Object.entries(map).forEach(([key, { total, count }]) => {
        result[key] = {
          avg: Math.round((total / count) * 10) / 10,
          count,
        }
      })
      setRatingMap(result)
    }

    fetchRatings()
  }, [])

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
    <div className="grid grid-cols-2 gap-4 pb-4 mt-4">
      {items.map((item) => {
        // Prefer DB image_url, then COFFEE_IMAGES map by id, then name slug
        const itemImage =
          item.imageUrl ||
          COFFEE_IMAGES[item.id] ||
          COFFEE_IMAGES[item.name.toLowerCase().replace(/\s+/g, "-")]

        const hasBadge = item.popular || item.isNew
        const ratingData = ratingMap[item.name.toLowerCase()]
        const ratingLabel = ratingData
          ? `★${ratingData.avg} (${ratingData.count})`
          : null

        return (
          <Card 
            key={item.id} 
            className="flex flex-col p-4 text-center border-border/50 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98] h-full"
            onClick={() => onSelectItem({ name: item.name, price: `${item.originalPrice ?? item.price} TL` })}
          >
            <div className="mb-3 flex justify-center">
              {itemImage ? (
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary/20">
                  <Image
                    src={itemImage}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Coffee className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <h3 className="text-md font-semibold text-foreground">{item.name}</h3>

              {/* Badge satırı: popular/isNew + varsa rating yanında */}
              {hasBadge && (
                <div className="my-1 flex flex-wrap items-center justify-center gap-1">
                  {item.popular && (
                    <Badge variant="secondary" className="text-[10px]">
                      Popular
                    </Badge>
                  )}
                  {item.isNew && (
                    <Badge className="text-[10px] bg-emerald-500 hover:bg-emerald-500 text-white">
                      New
                    </Badge>
                  )}
                  {ratingLabel && (
                    <span className="text-[10px] font-medium text-amber-500">
                      {ratingLabel}
                    </span>
                  )}
                </div>
              )}

              {/* Badge yoksa rating ismin altında göster */}
              {!hasBadge && ratingLabel && (
                <p className="text-[10px] font-medium text-amber-500 mt-0.5">
                  {ratingLabel}
                </p>
              )}

              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
              <div className="mt-auto pt-3">
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
                  {item.discountPercent && item.discountPercent > 0 ? (
                    <>
                      <span className="text-xs line-through text-muted-foreground whitespace-nowrap">{item.originalPrice} TL</span>
                      <span className="text-lg font-bold text-destructive whitespace-nowrap">{item.price} TL</span>
                      <Badge variant="destructive" className="text-[10px] shrink-0">
                        -{item.discountPercent}%
                      </Badge>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-primary whitespace-nowrap">{item.price} TL</span>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground pointer-events-none"
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
