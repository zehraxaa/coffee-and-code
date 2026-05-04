import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Coffee, Star, X } from "lucide-react"
import type { Order } from "@/lib/types"
import { useBroadcastCampaigns } from "@/hooks/use-broadcast-campaigns"
import { getMenuItemIdByName } from "@/lib/menu-items"

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

interface CustomOrderFormProps {
  onBack: () => void
  onPlaceOrder: (order: Omit<Order, "id" | "timestamp">) => void
  preselectedItem?: { name: string; price: string }
  orders?: Order[]
}

interface OrderConfirmPopupProps {
  order: Omit<Order, "id" | "timestamp">
  itemName: string
  price: string
  hasCampaignDiscount?: boolean
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
              <p className="font-medium text-foreground">{order.sugarLevel}/5 · {sugarLabel(order.sugarLevel)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Cup Type</p>
              <p className="font-medium text-foreground capitalize">{order.cupType}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Cup Size</p>
              <p className="font-medium text-foreground capitalize">{order.cupSize}</p>
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

export function CustomOrderForm({ onBack, onPlaceOrder, preselectedItem, orders = [] }: CustomOrderFormProps) {
  const { applyDiscount } = useBroadcastCampaigns()
  const [coffeeStrength, setCoffeeStrength] = useState<"smooth" | "balanced" | "strong">("balanced")
  const [sugarLevel, setSugarLevel] = useState([0])
  const [shot, setShot] = useState<"single" | "double">("single")
  const [milkType, setMilkType] = useState<"whole" | "lactose-free" | "oat">("whole")
  const [cupType, setCupType] = useState<"paper" | "plastic" | "glass" | "porcelain">(
    isIcedItem(preselectedItem?.name) ? "plastic" : "paper"
  )
  const [cupSize, setCupSize] = useState<"small" | "medium" | "large">("small")
  const [syrups, setSyrups] = useState<string[]>([])
  const [chocolateType, setChocolateType] = useState<"white" | "milk" | "dark">("milk")
  const [showConfirm, setShowConfirm] = useState(false)
  const [note, setNote] = useState("")

  const noMilk = isNoMilkItem(preselectedItem?.name)
  const isMocha = isMochaItem(preselectedItem?.name)
  const isIced = isIcedItem(preselectedItem?.name)

  const availableSyrups = ["Vanilla", "Caramel", "Hazelnut", "Lotus", "Peppermint"]

  const toggleSyrup = (syrup: string) => {
    setSyrups((prev) => {
      if (prev.includes(syrup)) return prev.filter((s) => s !== syrup)
      if (prev.length >= 2) return prev // Max 2 syrup
      return [...prev, syrup]
    })
  }

  const getBasePrice = (): number => {
    if (!preselectedItem) return 100
    const numeric = parseInt(preselectedItem.price.replace(/[^0-9]/g, ""), 10)
    return isNaN(numeric) ? 100 : numeric
  }

  const basePriceNum = getBasePrice()
  const itemId = preselectedItem ? getMenuItemIdByName(preselectedItem.name) : undefined
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
  }, [itemId, preselectedItem?.name, applyDiscount, basePriceNum])

  const calculatePrice = (): string => {
    let final = discountResult.finalPrice
    const sizeExtra = cupSize === "medium" ? 10 : cupSize === "large" ? 20 : 0
    const syrupExtra = (noMilk ? 0 : syrups.length) * 10
    final += sizeExtra + syrupExtra
    return `${final} TL`
  }

  const buildOrder = (): Omit<Order, "id" | "timestamp"> => ({
    itemName: preselectedItem?.name,
    coffeeStrength,
    sugarLevel: sugarLevel[0],
    shot,
    milkType,
    cupType,
    cupSize,
    syrups: noMilk ? [] : syrups,
    chocolateType: isMocha ? chocolateType : undefined,
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {activeCampaignForItem ? (
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

        <div className="space-y-6 pb-6">
          {/* Coffee Strength */}
          <Card className="p-6">
            <Label className="text-base font-semibold text-foreground">Coffee Strength</Label>
            <p className="mt-1 text-sm text-muted-foreground">How intense do you want it?</p>
            <div className="mt-4 flex gap-3">
              <Button variant={coffeeStrength === "smooth" ? "default" : "outline"} className="flex-1" onClick={() => setCoffeeStrength("smooth")}>
                Smooth
              </Button>
              <Button variant={coffeeStrength === "balanced" ? "default" : "outline"} className="flex-1" onClick={() => setCoffeeStrength("balanced")}>
                Balanced
              </Button>
              <Button variant={coffeeStrength === "strong" ? "default" : "outline"} className="flex-1" onClick={() => setCoffeeStrength("strong")}>
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
              <Button variant={shot === "single" ? "default" : "outline"} className="flex-1" onClick={() => setShot("single")}>
                Single
              </Button>
              <Button variant={shot === "double" ? "default" : "outline"} className="flex-1" onClick={() => setShot("double")}>
                Double
              </Button>
            </div>
          </Card>

          {/* Milk Type — Americano ve Espresso için gizle */}
          {!noMilk && (
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

          {/* Chocolate Type — sadece Mocha için */}
          {isMocha && (
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

          {/* Syrups — Americano ve Espresso için gizle */}
          {!noMilk && (
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
          {(() => {
            const itemReviews = orders.filter(
              (o: Order) =>
                o.rating &&
                o.review &&
                preselectedItem &&
                (o.itemName || "").toLowerCase() === preselectedItem.name.toLowerCase()
            )
            if (itemReviews.length === 0) return null
            const avg = itemReviews.reduce((sum: number, o: Order) => sum + (o.rating || 0), 0) / itemReviews.length
            return (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Customer Reviews</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-foreground">{avg.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({itemReviews.length})</span>
                  </div>
                </div>
                {itemReviews.map((o) => (
                  <Card key={o.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{o.reviewerName || "Anonymous"}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < (o.rating || 0) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                        ))}
                      </div>
                    </div>
                    {o.review && <p className="text-sm text-muted-foreground">&ldquo;{o.review}&rdquo;</p>}
                  </Card>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
        <OrderConfirmPopup order={buildOrder()} itemName={preselectedItem?.name || "Custom Coffee"} price={calculatePrice()} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </>
  )
}
