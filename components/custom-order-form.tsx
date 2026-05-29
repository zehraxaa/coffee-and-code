import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Coffee, Star, X } from "lucide-react"
import type { Order } from "@/lib/types"
import { useBroadcastCampaigns } from "@/hooks/use-broadcast-campaigns"
import { getMenuItemIdByName, type MenuItemCustomizations, STANDARD_SYRUPS } from "@/lib/menu-items"
import { getCoffeeImage } from "@/lib/coffee-images"
import { supabase } from "@/lib/supabase"
import { useMenuItems } from "@/hooks/use-menu-items"

const TEA_AROMAS = ["Regular", "Bergamot", "Ceylon"]

interface CustomOrderFormProps {
  onBack: () => void
  onPlaceOrder: (order: Omit<Order, "id" | "timestamp">) => void
  preselectedItem?: { name: string; price: string }
  orders?: Order[]
  prefillOrder?: Order
}

interface OrderConfirmPopupProps {
  order: Omit<Order, "id" | "timestamp">
  itemName: string
  price: string
  hasCampaignDiscount?: boolean
  onConfirm: () => void
  onCancel: () => void
  note?: string
  customizations: MenuItemCustomizations
}

function OrderConfirmPopup({ order, itemName, price, onConfirm, onCancel, note, customizations }: OrderConfirmPopupProps) {
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Popup */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-xl font-bold text-foreground">Order Summary</h2>
            <p className="text-sm text-muted-foreground">Please review your order</p>
          </div>
          <button onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors">
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
              <p className="text-xs text-muted-foreground">
                {customizations.shot ? `${order.shot} shot` : "Beverage"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {customizations.strength && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">{customizations.teaAroma ? "Brew Ratio" : "Strength"}</p>
                <p className="font-medium text-foreground capitalize">{order.coffeeStrength}</p>
              </div>
            )}
            {customizations.sugar && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Sugar</p>
                <p className="font-medium text-foreground">{order.sugarLevel}/5 · {sugarLabel(order.sugarLevel)}</p>
              </div>
            )}
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Cup Type</p>
              <p className="font-medium text-foreground capitalize">{order.cupType}</p>
            </div>
            {customizations.size && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Cup Size</p>
                <p className="font-medium text-foreground capitalize">{order.cupSize}</p>
              </div>
            )}
            {customizations.milk && order.milkType && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Milk</p>
                <p className="font-medium text-foreground capitalize">{order.milkType}</p>
              </div>
            )}
            {customizations.chocolate && order.chocolateType && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Chocolate</p>
                <p className="font-medium text-foreground capitalize">{order.chocolateType}</p>
              </div>
            )}
            {customizations.teaAroma && order.syrups && order.syrups.length > 0 && (
              <div className="p-3 rounded-xl bg-muted/50 col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Aroma</p>
                <p className="font-medium text-foreground">{order.syrups[0]}</p>
              </div>
            )}
            {customizations.syrup && order.syrups && order.syrups.length > 0 && (
              <div className="p-3 rounded-xl bg-muted/50 col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Syrups</p>
                <p className="font-medium text-foreground">{order.syrups.join(", ")}</p>
              </div>
            )}
          </div>

          {/* Note */}
          {note && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-muted-foreground mb-1">📝 Note</p>
              <p className="text-sm font-medium text-foreground">{note}</p>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">{price}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1 border-border text-foreground" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={onConfirm}>
            <Coffee className="mr-2 h-4 w-4" />
            Confirm Order
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CustomOrderForm({ onBack, onPlaceOrder, preselectedItem, orders = [], prefillOrder }: CustomOrderFormProps) {
  const { applyDiscount } = useBroadcastCampaigns()
  const { menuItems } = useMenuItems()
  
  const activeItemName = prefillOrder?.itemName || preselectedItem?.name
  const activeItem = menuItems.find((i) => i.name === activeItemName)
  const isIced = activeItem?.category === "iced"
  
  const customizations = activeItem?.customizations || {
    strength: true, sugar: true, shot: true, milk: true, size: true, syrup: true, chocolate: false, teaAroma: false
  }

  const [coffeeStrength, setCoffeeStrength] = useState<Order["coffeeStrength"]>(prefillOrder?.coffeeStrength || "balanced")
  const [sugarLevel, setSugarLevel] = useState([prefillOrder?.sugarLevel ?? 0])
  const [shot, setShot] = useState<"single" | "double">(prefillOrder?.shot || "single")
  const [milkType, setMilkType] = useState<"whole" | "lactose-free" | "oat">(prefillOrder?.milkType || "whole")
  const [cupType, setCupType] = useState<"paper" | "plastic" | "glass" | "porcelain">(
    prefillOrder?.cupType || (isIced ? "plastic" : "paper")
  )
  const [cupSize, setCupSize] = useState<"small" | "medium" | "large">(prefillOrder?.cupSize || "small")
  const [syrups, setSyrups] = useState<string[]>(prefillOrder?.syrups || [])
  const [teaAroma, setTeaAroma] = useState<string | undefined>(
    prefillOrder?.itemName && customizations.teaAroma ? prefillOrder.syrups?.[0] : undefined
  )
  const [chocolateType, setChocolateType] = useState<"white" | "milk" | "dark">(prefillOrder?.chocolateType || "milk")
  const [showConfirm, setShowConfirm] = useState(false)
  const [note, setNote] = useState(prefillOrder?.note || "")

  const [itemReviews, setItemReviews] = useState<Order[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  useEffect(() => {
    if (!activeItemName) return

    const fetchReviews = async () => {
      setReviewsLoading(true)
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .not("rating", "is", null)
        .eq("item_name", activeItemName)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setItemReviews(
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
      setReviewsLoading(false)
    }

    fetchReviews()
  }, [activeItemName])

  const availableSyrups = customizations.syrupOptions && customizations.syrupOptions.length > 0
    ? customizations.syrupOptions
    : STANDARD_SYRUPS

  const toggleSyrup = (syrup: string) => {
    setSyrups((prev) => {
      if (prev.includes(syrup)) return prev.filter((s) => s !== syrup)
      if (prev.length >= 2) return prev // Max 2 syrup
      return [...prev, syrup]
    })
  }

  const getBasePrice = (): number => {
    if (prefillOrder && prefillOrder.price) {
      const numeric = parseInt(prefillOrder.price.replace(/[^0-9]/g, ""), 10)
      return isNaN(numeric) ? 100 : numeric
    }
    if (!preselectedItem) return 100
    const numeric = parseInt(preselectedItem.price.replace(/[^0-9]/g, ""), 10)
    return isNaN(numeric) ? 100 : numeric
  }

  const basePriceNum = getBasePrice()
  const itemId = activeItemName ? getMenuItemIdByName(activeItemName) : undefined
  const discountResult = itemId
    ? applyDiscount(basePriceNum, itemId)
    : { finalPrice: basePriceNum, discount: 0, campaign: undefined }

  const [activeCampaignForItem, setActiveCampaign] = useState(discountResult.campaign || null)

  useEffect(() => {
    if (itemId) {
      const result = applyDiscount(basePriceNum, itemId)
      setActiveCampaign(result.campaign || null)
    } else {
      setActiveCampaign(null)
    }
  }, [itemId, activeItemName, applyDiscount, basePriceNum])

  const calculatePrice = (): string => {
    let final = discountResult.finalPrice
    const sizeExtra = customizations.size ? (cupSize === "medium" ? 10 : cupSize === "large" ? 20 : 0) : 0
    const syrupExtra = customizations.syrup ? syrups.length * 10 : 0
    final += sizeExtra + syrupExtra
    return `${final} TL`
  }

  const buildOrder = (): Omit<Order, "id" | "timestamp"> => ({
    itemName: activeItemName,
    coffeeStrength,
    sugarLevel: sugarLevel[0],
    shot: customizations.shot ? shot : "single",
    milkType: customizations.milk ? milkType : undefined,
    cupType,
    cupSize: customizations.size ? cupSize : "small",
    syrups: customizations.teaAroma ? (teaAroma ? [teaAroma] : []) : (customizations.syrup ? syrups : []),
    chocolateType: customizations.chocolate ? chocolateType : undefined,
    status: "received",
    price: calculatePrice(),
    note: note.trim() || undefined,
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
  }

  const coffeeImg = activeItemName ? (activeItem?.imageUrl || getCoffeeImage(activeItemName)) : undefined

  return (
    <>
      <div className={coffeeImg ? "relative" : "space-y-6"}>
        {coffeeImg ? (
          <>
            {/* Hero image — flush top, fades out at bottom */}
            <div className="relative w-full h-72 -mx-0 overflow-hidden">
              <Image
                src={coffeeImg}
                alt={activeItemName || "Coffee"}
                fill
                className="object-cover object-center"
                priority
              />
              {/* Bottom fade */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
            </div>

            {/* Header — positioned below the image */}
            <div className="flex items-center gap-4 mt-4 px-0">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {activeItemName ? `Customize ${activeItemName}` : "Custom Order"}
                </h1>
                {activeItem?.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 mb-1">{activeItem.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {activeCampaignForItem && activeCampaignForItem.discountPercent > 0 ? (
                      <>
                        <span className="line-through opacity-60">{basePriceNum} TL</span>
                        <span className="text-primary font-semibold ml-1">{discountResult.finalPrice} TL</span>
                        <Badge variant="destructive" className="ml-1.5 text-[10px]">
                          -{activeCampaignForItem.discountPercent}%
                        </Badge>
                      </>
                    ) : (
                      `${basePriceNum} TL`
                    )}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Non-latte: original header */
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {activeItemName ? `Customize ${activeItemName}` : "Custom Order"}
              </h1>
              {activeItem?.description && (
                <p className="text-sm text-muted-foreground mt-0.5 mb-1">{activeItem.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {activeCampaignForItem && activeCampaignForItem.discountPercent > 0 ? (
                    <>
                      <span className="line-through opacity-60">{basePriceNum} TL</span>
                      <span className="text-primary font-semibold ml-1">{discountResult.finalPrice} TL</span>
                      <Badge variant="destructive" className="ml-1.5 text-[10px]">
                        -{activeCampaignForItem.discountPercent}%
                      </Badge>
                    </>
                  ) : (
                    `${basePriceNum} TL`
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6 pb-6">
          {/* Coffee Strength / Tea Brew Ratio */}
          {customizations.strength && (
            <Card className="p-6">
              <Label className="text-base font-semibold text-foreground">
                {customizations.teaAroma ? "Brew Ratio" : "Coffee Strength"}
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {customizations.teaAroma ? "Choose how strong the tea is brewed." : "How intense do you want it?"}
              </p>
              <div className="mt-4 flex gap-3">
                {customizations.teaAroma ? (
                  <>
                    <Button variant={coffeeStrength === "light" ? "default" : "outline"} className="flex-1" onClick={() => setCoffeeStrength("light")}>
                      Light
                    </Button>
                    <Button variant={coffeeStrength === "balanced" ? "default" : "outline"} className="flex-1" onClick={() => setCoffeeStrength("balanced")}>
                      Balanced
                    </Button>
                    <Button variant={coffeeStrength === "dark" ? "default" : "outline"} className="flex-1" onClick={() => setCoffeeStrength("dark")}>
                      Dark
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant={coffeeStrength === "smooth" ? "default" : "outline"} className="flex-1" onClick={() => setCoffeeStrength("smooth")}>
                      Smooth
                    </Button>
                <Button variant={coffeeStrength === "balanced" ? "default" : "outline"} className="flex-1" onClick={() => setCoffeeStrength("balanced")}>
                  Balanced
                </Button>
                <Button variant={coffeeStrength === "strong" ? "default" : "outline"} className="flex-1" onClick={() => setCoffeeStrength("strong")}>
                  Strong
                </Button>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Sugar Level */}
          {customizations.sugar && (
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
          )}

          {/* Shot Type */}
          {customizations.shot && (
            <Card className="p-6">
              <Label className="text-base font-semibold text-foreground">Espresso Shot</Label>
              <div className="mt-4 flex gap-3">
                <Button variant={shot === "single" ? "default" : "outline"} className="flex-1" onClick={() => setShot("single")}>
                  Single
                </Button>
                <Button variant={shot === "double" ? "default" : "outline"} className="flex-1" onClick={() => setShot("double")}>
                  Double
                </Button>
              </div>
            </Card>
          )}

          {/* Milk Type */}
          {customizations.milk && (
            <Card className="p-6">
              <Label className="text-base font-semibold text-foreground">Milk Type</Label>
              <div className="mt-4 flex gap-3">
                <Button variant={milkType === "whole" ? "default" : "outline"} className="flex-1" onClick={() => setMilkType("whole")}>
                  Whole
                </Button>
                <Button variant={milkType === "lactose-free" ? "default" : "outline"} className="flex-1" onClick={() => setMilkType("lactose-free")}>
                  Lactose-Free
                </Button>
                <Button variant={milkType === "oat" ? "default" : "outline"} className="flex-1" onClick={() => setMilkType("oat")}>
                  Oat
                </Button>
              </div>
            </Card>
          )}

          {/* Cup Size */}
          {customizations.size && (
            <Card className="p-6">
              <Label className="text-base font-semibold text-foreground">Cup Size</Label>
              <p className="mt-1 text-sm text-muted-foreground">Medium: +10 TL, Large: +20 TL</p>
              <div className="mt-4 flex gap-3">
                {(["small", "medium", "large"] as const).map((size) => (
                  <Button key={size} variant={cupSize === size ? "default" : "outline"} className="flex-1 capitalize" onClick={() => setCupSize(size)}>
                    {size}
                  </Button>
                ))}
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
                  <Button variant={cupType === "plastic" ? "default" : "outline"} className="flex-1" onClick={() => setCupType("plastic")}>
                    Plastic
                  </Button>
                  <Button variant={cupType === "glass" ? "default" : "outline"} className="flex-1" onClick={() => setCupType("glass")}>
                    Glass
                  </Button>
                </>
              ) : (
                // Sıcak içecekler: Paper, Glass, Porcelain
                <>
                  <Button variant={cupType === "paper" ? "default" : "outline"} className="flex-1" onClick={() => setCupType("paper")}>
                    Paper
                  </Button>
                  <Button variant={cupType === "glass" ? "default" : "outline"} className="flex-1" onClick={() => setCupType("glass")}>
                    Glass
                  </Button>
                  <Button variant={cupType === "porcelain" ? "default" : "outline"} className="flex-1" onClick={() => setCupType("porcelain")}>
                    Porcelain
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Chocolate Type */}
          {customizations.chocolate && (
            <Card className="p-6">
              <Label className="text-base font-semibold text-foreground">Chocolate Type</Label>
              <p className="mt-1 text-sm text-muted-foreground">Choose your chocolate</p>
              <div className="mt-4 flex gap-3">
                <Button variant={chocolateType === "white" ? "default" : "outline"} className="flex-1" onClick={() => setChocolateType("white")}>
                  White
                </Button>
                <Button variant={chocolateType === "milk" ? "default" : "outline"} className="flex-1" onClick={() => setChocolateType("milk")}>
                  Milk
                </Button>
                <Button variant={chocolateType === "dark" ? "default" : "outline"} className="flex-1" onClick={() => setChocolateType("dark")}>
                  Dark
                </Button>
              </div>
            </Card>
          )}

          {/* Syrups */}
          {customizations.syrup && (
            <Card className="p-6">
              <Label className="text-base font-semibold text-foreground">Add Syrups</Label>
              <p className="mt-1 text-sm text-muted-foreground">Max 2 syrups · +10 TL each {syrups.length >= 2 && <span className="ml-2 text-amber-500 font-medium">Max reached</span>}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {availableSyrups.map((syrup) => {
                  const isSelected = syrups.includes(syrup)
                  const isDisabled = !isSelected && syrups.length >= 2
                  return (
                    <Badge key={syrup} variant={isSelected ? "default" : "outline"} className={`px-4 py-2 transition-opacity ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`} onClick={() => !isDisabled && toggleSyrup(syrup)}>
                      {syrup}
                    </Badge>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Aroma — Tea only */}
          {customizations.teaAroma && (
            <Card className="p-6">
              <Label className="text-base font-semibold text-foreground">Aroma</Label>
              <p className="mt-1 text-sm text-muted-foreground">Optional aroma selection</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {TEA_AROMAS.map((aroma) => {
                  const isSelected = teaAroma === aroma
                  return (
                    <Badge
                      key={aroma}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2"
                      onClick={() => setTeaAroma(isSelected ? undefined : aroma)}
                    >
                      {aroma}
                    </Badge>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Add Note */}
          <Card className="p-6">
            <Label htmlFor="order-note" className="text-base font-semibold text-foreground">Add Note</Label>
            <p className="mt-1 text-sm text-muted-foreground">Any special requests?</p>
            <textarea
              id="order-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. extra hot, no foam, allergen info…"
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Card>

          {/* Place Order Button */}
          <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlePlaceOrderClick}>
            <Coffee className="mr-2 h-5 w-5" />
            Place Order
          </Button>

          {/* Customer Reviews for this coffee */}
          {!reviewsLoading && itemReviews.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">Customer Reviews</h3>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-foreground">
                    {(itemReviews.reduce((sum, o) => sum + (o.rating || 0), 0) / itemReviews.length).toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">({itemReviews.length})</span>
                </div>
              </div>
              {itemReviews.map((o) => {
                const sugarLabel = (v: number) => {
                  if (v === 0) return "No Sugar"
                  if (v <= 2) return `Sugar ${v}/5`
                  if (v === 3) return "Medium Sweet"
                  return `Sweet ${v}/5`
                }
                const oCustomizations = menuItems.find(i => i.name === o.itemName)?.customizations || {
                  strength: true, sugar: true, shot: true, milk: true, size: true, syrup: true, chocolate: false, teaAroma: false
                }
                return (
                  <Card key={o.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{o.reviewerName || "Anonymous"}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < (o.rating || 0) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                        ))}
                      </div>
                    </div>
                    {/* Order customization details */}
                    <div className="flex flex-wrap gap-1.5">
                      {oCustomizations.strength && (
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary capitalize">
                          {oCustomizations.teaAroma ? `${o.coffeeStrength} brew` : o.coffeeStrength}
                        </span>
                      )}
                      {oCustomizations.shot && (
                        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          {o.shot} shot
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {sugarLabel(o.sugarLevel)}
                      </span>
                      {oCustomizations.milk && o.milkType && (
                        <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400 capitalize">
                          {o.milkType} milk
                        </span>
                      )}
                      {oCustomizations.teaAroma && o.syrups && o.syrups.length > 0 && (
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          {o.syrups[0]}
                        </span>
                      )}
                      {oCustomizations.syrup && o.syrups && o.syrups.length > 0 && o.syrups.map((s) => (
                        <span key={s} className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:text-purple-400">
                          {s}
                        </span>
                      ))}
                      {oCustomizations.chocolate && o.chocolateType && (
                        <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:text-orange-400 capitalize">
                          {o.chocolateType} chocolate
                        </span>
                      )}
                    </div>
                    {o.review && <p className="text-sm text-muted-foreground">&ldquo;{o.review}&rdquo;</p>}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
        <OrderConfirmPopup order={buildOrder()} itemName={activeItemName || "Custom Coffee"} price={calculatePrice()} onConfirm={handleConfirm} onCancel={handleCancel} note={note.trim() || undefined} customizations={customizations} />
      )}
    </>
  )
}
