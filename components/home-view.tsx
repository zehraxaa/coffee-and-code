"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coffee, Star, ChevronRight, Sparkles, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import type { Campaign, Order, CoffeeOfMonth } from "@/lib/types"
import { ALL_MENU_ITEMS } from "@/lib/menu-items"
import { getCoffeeImage } from "@/lib/coffee-images"
import { supabase } from "@/lib/supabase"

const PROMO_STORAGE_KEY = "cc_splash_image"
const COFFEE_OF_MONTH_KEY = "cc_coffee_of_month"

const DEFAULT_COFFEE: CoffeeOfMonth = {
  name: "Spanish Latte",
  description: "Sweet and creamier flavour",
  origin: "Spain",
  updatedAt: "",
}

interface HomeViewProps {
  hasSeenPromo: boolean
  onPromoClosed: () => void
  onViewFullMenu: () => void
  loyaltyStamps: number
  freeCoffeeCode?: string | null
  onRedeemFreeCoffee?: () => void
  onOrderCoffeeOfMonth: (name: string, price: string) => void
  onOrderFavorite: (item: { name: string; price: string }) => void
  campaigns?: Campaign[]
  orders?: Order[]
  splashImageUrl?: string | null
}

export function HomeView({
  hasSeenPromo,
  onPromoClosed,
  onViewFullMenu,
  loyaltyStamps,
  freeCoffeeCode,
  onRedeemFreeCoffee,
  onOrderCoffeeOfMonth,
  onOrderFavorite,
  campaigns = [],
  orders = [],
  splashImageUrl,
}: HomeViewProps) {
  const totalStamps = 8
  const [currentCampaign, setCurrentCampaign] = useState(0)

  // Load barista-set coffee of the month
  const [coffeeOfMonth, setCoffeeOfMonth] = useState<CoffeeOfMonth>(DEFAULT_COFFEE)
  useEffect(() => {
    // 1. Fast fallback from localStorage
    try {
      const stored = localStorage.getItem(COFFEE_OF_MONTH_KEY)
      if (stored) setCoffeeOfMonth(JSON.parse(stored))
    } catch { /* ignore */ }

    // 2. Fetch fresh data from Supabase
    const fetchCoffeeOfMonth = async () => {
      try {
        const { data, error } = await supabase
          .from("coffee_of_month")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data && !error) {
          const freshCoffee: CoffeeOfMonth = {
            name: data.name,
            description: data.description,
            origin: data.origin,
            imageUrl: data.image_url || undefined,
            updatedAt: data.updated_at,
          }
          setCoffeeOfMonth(freshCoffee)
          localStorage.setItem(COFFEE_OF_MONTH_KEY, JSON.stringify(freshCoffee))
        }
      } catch (err) {
        console.error("Error fetching coffee of the month:", err)
      }
    }

    fetchCoffeeOfMonth()
  }, [])

  // Filter active campaigns (not expired)
  const activeCampaigns = campaigns.filter((c) => new Date(c.expiresAt) > new Date())

  useEffect(() => {
    if (activeCampaigns.length === 0) return
    const interval = setInterval(() => {
      setCurrentCampaign((prev) => (prev + 1) % activeCampaigns.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeCampaigns.length])

  // ── Dynamic Customer Favorites (Global) ──────────────────────────────
  const [globalRatedOrders, setGlobalRatedOrders] = useState<Order[]>([])

  useEffect(() => {
    const fetchGlobalRatedOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .not("rating", "is", null)

      if (!error && data) {
        setGlobalRatedOrders(
          data.map((o: any) => ({
            id: o.id,
            timestamp: new Date(o.created_at),
            orderNumber: o.order_number,
            itemName: o.item_name,
            coffeeStrength: o.coffee_strength,
            sugarLevel: o.sugar_level,
            shot: o.shot,
            milkType: o.milk_type || undefined,
            cupType: o.cup_type,
            cupSize: o.cup_size,
            syrups: o.syrups || [],
            chocolateType: o.chocolate_type || undefined,
            isGuest: o.is_guest,
            userId: o.user_id || undefined,
            status: o.status,
            rating: o.rating || undefined,
            review: o.review || undefined,
            reviewerName: o.reviewer_name || undefined,
            price: o.price || undefined,
            note: o.note || undefined,
          }))
        )
      }
    }

    fetchGlobalRatedOrders()
  }, [])

  // Group completed orders with ratings by itemName, compute avg rating + count
  const dynamicFavorites = useMemo(() => {
    const ratingMap: Record<string, { total: number; count: number; price: string }> = {}

    globalRatedOrders.forEach((o) => {
      if (!o.rating || !o.itemName) return
      const key = o.itemName
      if (!ratingMap[key]) {
        // Find price from menu items
        const menuItem = ALL_MENU_ITEMS.find(
          (m) => m.name.toLowerCase() === key.toLowerCase()
        )
        ratingMap[key] = {
          total: 0,
          count: 0,
          price: menuItem ? `${menuItem.price} TL` : "— TL",
        }
      }
      ratingMap[key].total += o.rating
      ratingMap[key].count += 1
    })

    const sorted = Object.entries(ratingMap)
      .map(([name, { total, count, price }]) => ({
        name,
        price,
        rating: Math.round((total / count) * 10) / 10,
        count,
      }))
      .sort((a, b) => b.rating - a.rating || b.count - a.count)
      .slice(0, 3)

    // If not enough real data, fall back to static placeholders
    if (sorted.length === 0) {
      return [
        { name: "Latte", price: "100 TL", rating: null, count: 0 },
        { name: "Cappuccino", price: "100 TL", rating: null, count: 0 },
        { name: "Mocha", price: "100 TL", rating: null, count: 0 },
      ]
    }
    return sorted
  }, [globalRatedOrders])


  return (
    <>
      {/* Promo Popup — barista controls the image; only shown when an image is set */}
      <AnimatePresence>
        {!hasSeenPromo && !!splashImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-sm rounded-2xl bg-card shadow-2xl">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10 rounded-full bg-background/50 hover:bg-background/80"
                onClick={onPromoClosed}
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
                <Image
                  src={splashImageUrl}
                  alt="Coffee of the Month Promo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center  pt-0 pb-0">
          <Image
            src="/images/bir-20ba-c5-9fl-c4-b1k-20ekleyin-282-29.png"
            alt="Coffee & Code Logo"
            width={200}
            height={200}
            priority
            className="h-auto w-44 rounded-2xl"
          />
        </div>

        {/* Loyalty Card */}
        <Card className="overflow-hidden bg-gradient-to-br from-primary to-accent p-5 max-h-[200px] mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-foreground/80">Loyalty Rewards</p>
              <p className="text-2xl font-bold text-primary-foreground">
                {loyaltyStamps}/{totalStamps} Stamps
              </p>
            </div>
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {Array.from({ length: totalStamps }).map((_, i) => (
              <div
                key={i}
                className={`h-7 w-7 shrink-0 rounded-full border-2 border-primary-foreground flex items-center justify-center ${i < loyaltyStamps ? "bg-primary-foreground" : "bg-primary-foreground/20"
                  }`}
              >
                {i < loyaltyStamps && <Coffee className="h-4 w-4 text-primary" />}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-primary-foreground/80">
            {loyaltyStamps >= 8
              ? "🎉 Free coffee earned! Redeem below."
              : `${totalStamps - loyaltyStamps} more stamps for a free drink!`}
          </p>
        </Card>

        {/* Free Coffee Coupon */}
        {freeCoffeeCode && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="overflow-hidden border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                  <Coffee className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-700 dark:text-green-300">🎉 Free Coffee!</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Show this code to the barista</p>
                </div>
              </div>
              <div className="rounded-lg bg-white dark:bg-black/20 border border-green-300 px-4 py-3 text-center mb-3">
                <span className="font-mono text-2xl font-bold tracking-widest text-green-700 dark:text-green-300">
                  {freeCoffeeCode}
                </span>
              </div>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={onRedeemFreeCoffee}>
                Redeem Now
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Campaigns Slider */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Current Campaigns</h2>
          {activeCampaigns.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
              No active campaigns at the moment. Check back later!
            </div>
          ) : (
            <>
              <div className="relative h-[160px] w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCampaign}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    {activeCampaigns[currentCampaign] && (
                      <Card
                        className={`h-full w-full p-6 border-0 text-primary-foreground shadow-lg flex flex-col justify-center overflow-hidden rounded-2xl ${activeCampaigns[currentCampaign].imageUrl
                            ? "bg-transparent"
                            : "bg-gradient-to-br from-primary to-accent"
                          }`}
                      >
                        {activeCampaigns[currentCampaign].imageUrl && (
                          <div className="absolute inset-0 rounded-2xl overflow-hidden">
                            <Image
                              src={activeCampaigns[currentCampaign].imageUrl!}
                              alt={activeCampaigns[currentCampaign].title}
                              fill
                              className="object-cover rounded-2xl"
                            />
                            <div className="absolute inset-0 bg-black/20 rounded-2xl" />
                          </div>
                        )}
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold">
                            {activeCampaigns[currentCampaign].title}
                          </h3>
                          {activeCampaigns[currentCampaign].description && (
                            <p className="mt-1 text-sm opacity-90">
                              {activeCampaigns[currentCampaign].description}
                            </p>
                          )}
                        </div>
                      </Card>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="mt-4 flex justify-center gap-2">
                {activeCampaigns.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${index === currentCampaign ? "bg-primary" : "bg-muted"
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Coffee of the Month */}
        <Card className="overflow-hidden p-0">
          <div className="relative">
            {coffeeOfMonth.imageUrl ? (
              <>
                <div className="relative w-full h-48">
                  <Image src={coffeeOfMonth.imageUrl} alt={coffeeOfMonth.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-sm font-semibold text-white/70">Coffee of the Month</h2>
                        <Badge variant="secondary" className="text-[10px]">Featured</Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-white">{coffeeOfMonth.name}</h3>
                      <p className="text-sm text-white/80 mt-0.5">{coffeeOfMonth.description}</p>
                      {coffeeOfMonth.origin && (
                        <Badge variant="outline" className="text-xs mt-1 border-white/30 text-white">
                          {coffeeOfMonth.origin}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    className="w-full mt-3 text-black hover:opacity-90"
                    style={{ backgroundColor: "#f3ede9" }}
                    onClick={() => {
                      const menuItem = ALL_MENU_ITEMS.find(
                        (m) => m.name.toLowerCase() === coffeeOfMonth.name.toLowerCase()
                      )
                      onOrderCoffeeOfMonth(
                        coffeeOfMonth.name,
                        menuItem ? `${menuItem.price} TL` : "120 TL"
                      )
                    }}
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    Order Now
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Coffee of the Month</h2>
                  <Badge variant="secondary">Featured</Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-primary">{coffeeOfMonth.name}</h3>
                    <p className="text-sm text-muted-foreground">{coffeeOfMonth.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{coffeeOfMonth.origin}</Badge>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      const menuItem = ALL_MENU_ITEMS.find(
                        (m) => m.name.toLowerCase() === coffeeOfMonth.name.toLowerCase()
                      )
                      onOrderCoffeeOfMonth(
                        coffeeOfMonth.name,
                        menuItem ? `${menuItem.price} TL` : "120 TL"
                      )
                    }}
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    Order Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Customer Favorites — dynamic ratings */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Customer Favorites</h2>
            {dynamicFavorites.some((f) => f.count > 0) && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Based on customer ratings
              </Badge>
            )}
          </div>
          <div className="space-y-3">
            {dynamicFavorites.map((item, idx) => {
              const coffeeImg = getCoffeeImage(item.name)
              return (
                <Card
                  key={item.name}
                  className="cursor-pointer p-4 transition-colors hover:bg-muted/50"
                  onClick={() => onOrderFavorite({ name: item.name, price: item.price })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {coffeeImg ? (
                        <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 border-primary/20">
                          <Image
                            src={coffeeImg}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <Coffee className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-primary">{item.price}</p>
                          {item.rating !== null ? (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${s <= Math.round(item.rating!)
                                      ? "fill-accent text-accent"
                                      : "fill-muted text-muted-foreground/30"
                                    }`}
                                />
                              ))}
                              <span className="text-xs text-muted-foreground ml-0.5">
                                {item.rating} ({item.count})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">
                              No ratings yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-3 pb-6">
          <Button size="lg" variant="outline" className="w-full bg-transparent" onClick={onViewFullMenu}>
            View Full Menu
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  )
}
