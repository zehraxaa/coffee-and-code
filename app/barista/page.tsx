"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { BaristaDashboard } from "@/components/barista-dashboard"
import { useBroadcastOrders } from "@/hooks/use-broadcast-orders"
import { useToast } from "@/hooks/use-toast"
import type { OrderStatus } from "@/lib/types"
import {
  Users,
  ShoppingBag,
  Megaphone,
  UserCog,
  ClipboardList,
  List,
  Star,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Coffee,
  TrendingUp,
  ChevronLeft,
  CalendarDays,
  Search,
  Shield,
  KeyRound,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatOrderNumber } from "@/lib/order-number"
import { CampaignForm } from "@/components/campaign-form"
import { useBroadcastCampaigns } from "@/hooks/use-broadcast-campaigns"
import type { CoffeeOfMonth } from "@/lib/types"

const COFFEE_OF_MONTH_KEY = "cc_coffee_of_month"
const BARISTA_PIN_KEY = "cc_barista_pin"

// Yetkili yönetici bilgileri (hardcoded — sadece bu kişi PIN değiştirebilir)
const ADMIN_EMAIL = "aysezehraaydogdu@gmail.com"
const ADMIN_SECURITY_CODE = "1q2w3e"

function getBaristaPin(): string {
  if (typeof window === "undefined") return "1234"
  return localStorage.getItem(BARISTA_PIN_KEY) || "1234"
}

type SidebarItem = {
  id: string
  label: string
  icon: React.ElementType
}

const sidebarItems: SidebarItem[] = [
  { id: "orders", label: "Orders on Progress", icon: ShoppingBag },
  { id: "users", label: "Customers", icon: Users },
  { id: "listoforders", label: "List of Orders", icon: List },
  { id: "campaign", label: "Create Campaign", icon: Megaphone },
  { id: "coffeemonth", label: "Coffee of the Month", icon: Coffee },
  { id: "account", label: "Barista Account", icon: UserCog },
  { id: "surveys", label: "Customer Ratings", icon: ClipboardList },
]

export default function BaristaPage() {
  const { orders, broadcastUpdateStatus } = useBroadcastOrders()
  const { campaigns, broadcastCreateCampaign, broadcastDeleteCampaign, splashImageUrl, broadcastUpdateSplashImage } = useBroadcastCampaigns()
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState("orders")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [codeInput, setCodeInput] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [codeError, setCodeError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // List of Orders state
  const [orderFilterStart, setOrderFilterStart] = useState("")
  const [orderFilterEnd, setOrderFilterEnd] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled">("all")

  // Customers state
  const [customerSearch, setCustomerSearch] = useState("")

  // Barista Account — Change PIN state
  const [acAdminEmail, setAcAdminEmail] = useState("")
  const [acSecurityCode, setAcSecurityCode] = useState("")
  const [acNewPin, setAcNewPin] = useState("")
  const [acConfirmPin, setAcConfirmPin] = useState("")
  const [acShowNewPin, setAcShowNewPin] = useState(false)
  const [acPinSaved, setAcPinSaved] = useState(false)
  const [acError, setAcError] = useState("")

  // Coffee of Month state
  const [comName, setComName] = useState("Spanish Latte")
  const [comDesc, setComDesc] = useState("Sweet and creamier flavour")
  const [comOrigin, setComOrigin] = useState("Spain")
  const [comImageUrl, setComImageUrl] = useState<string | null>(null)
  const [comSaved, setComSaved] = useState(false)
  const comImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COFFEE_OF_MONTH_KEY)
      if (stored) {
        const c: CoffeeOfMonth = JSON.parse(stored)
        setComName(c.name)
        setComDesc(c.description)
        setComOrigin(c.origin)
        if (c.imageUrl) setComImageUrl(c.imageUrl)
      }
    } catch { /* ignore */ }
  }, [])

  const handleSaveCoffeeOfMonth = () => {
    const data: CoffeeOfMonth = { name: comName, description: comDesc, origin: comOrigin, imageUrl: comImageUrl || undefined, updatedAt: new Date().toISOString() }
    localStorage.setItem(COFFEE_OF_MONTH_KEY, JSON.stringify(data))
    setComSaved(true)
    setTimeout(() => setComSaved(false), 3000)
    toast({ title: "Coffee of the Month Updated!", description: `Now showing: ${comName}` })
  }

  const handleComImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setComImageUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isAuthenticated])

  const handleLogin = () => {
    if (codeInput === getBaristaPin()) {
      setIsAuthenticated(true)
      setCodeError(false)
    } else {
      setCodeError(true)
      setCodeInput("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleChangeBaristaPin = () => {
    setAcError("")
    if (acAdminEmail.trim().toLowerCase() !== ADMIN_EMAIL) {
      setAcError("Admin email address is incoreect!")
      return
    }
    if (acSecurityCode.trim() !== ADMIN_SECURITY_CODE) {
      setAcError("Security code is incorrect!")
      return
    }
    if (acNewPin.trim().length < 4) {
      setAcError("New PIN at least 4 characters!")
      return
    }
    if (acNewPin !== acConfirmPin) {
      setAcError("PINs do not match!")
      return
    }
    localStorage.setItem(BARISTA_PIN_KEY, acNewPin.trim())
    setAcPinSaved(true)
    setAcAdminEmail("")
    setAcSecurityCode("")
    setAcNewPin("")
    setAcConfirmPin("")
    setTimeout(() => setAcPinSaved(false), 4000)
    toast({ title: "PIN Updated! 🔐", description: "Barista passcoode updated successfully!" })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  // Sound notification for new orders
  useEffect(() => {
    if (typeof window === "undefined") return

    let audioCtx: AudioContext | null = null
    let audioBuffer: AudioBuffer | null = null

    const initAudio = async () => {
      try {
        audioCtx = new AudioContext()
        const response = await fetch("/new-order.webm")
        const arrayBuffer = await response.arrayBuffer()
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      } catch (e) {
        console.warn("Audio init failed:", e)
      }
    }

    initAudio()

    const unlockAudio = () => {
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume()
      }
    }
    window.addEventListener("pointerdown", unlockAudio, { once: false })
    window.addEventListener("keydown", unlockAudio, { once: false })

    const playSound = () => {
      if (!audioCtx || !audioBuffer) return
      if (audioCtx.state === "suspended") {
        audioCtx.resume().then(() => {
          const source = audioCtx!.createBufferSource()
          source.buffer = audioBuffer
          source.connect(audioCtx!.destination)
          source.start(0)
        })
      } else {
        const source = audioCtx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioCtx.destination)
        source.start(0)
      }
    }

    const channel = new BroadcastChannel("coffee_and_code_orders")

    channel.onmessage = (event) => {
      if (event.data.type === "ORDER_PLACED") {
        playSound()
      }
    }

    return () => {
      channel.close()
      window.removeEventListener("pointerdown", unlockAudio)
      window.removeEventListener("keydown", unlockAudio)
      audioCtx?.close()
    }
  }, [])

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    broadcastUpdateStatus(orderId, status)
    toast({
      title: "Order Updated",
      description: `Status changed to ${status}`,
    })
  }

  // Tüm puanlanan siparişler
  const reviewedOrders = orders.filter((o) => o.rating)

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/images/bir-20ba-c5-9fl-c4-b1k-20ekleyin-282-29.png"
              alt="Coffee & Code Logo"
              width={120}
              height={120}
              priority
              className="h-auto w-28 rounded-2xl"
            />
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-foreground">Barista Panel</h1>
              <p className="text-sm text-muted-foreground">Enter your barista code</p>
            </div>
          </div>

          {/* Code input card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Barista Code</span>
            </div>

            <div className="relative">
              <Input
                ref={inputRef}
                type={showCode ? "text" : "password"}
                placeholder="Enter your barista code"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value)
                  setCodeError(false)
                }}
                onKeyDown={handleKeyDown}
                className={`pr-10 text-base tracking-widest ${codeError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowCode((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {codeError && (
              <p className="text-xs text-destructive">Incorrect code. Please try again.</p>
            )}

            <Button className="w-full" onClick={handleLogin}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Image
            src="/images/bir-20ba-c5-9fl-c4-b1k-20ekleyin-282-29.png"
            alt="Coffee & Code Logo"
            width={140}
            height={140}
            priority
            className="h-auto w-full rounded-xl"
          />
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {sidebarItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id
            // Yorum sayısını göster
            const badge = id === "surveys" && reviewedOrders.length > 0 ? reviewedOrders.length : null
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                  ${isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{label}</span>
                {badge && (
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"}`}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={() => { setIsAuthenticated(false); setCodeInput("") }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span>Sign Out</span>
          </button>
          <p className="text-[10px] text-muted-foreground text-center">Coffee & Code · Barista Panel</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {activeSection === "orders" ? (
          <BaristaDashboard orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
        ) : activeSection === "campaign" ? (
          /* ── Create Campaign Section ── */
          <CampaignForm
            campaigns={campaigns}
            onCreateCampaign={broadcastCreateCampaign}
            onDeleteCampaign={broadcastDeleteCampaign}
            splashImageUrl={splashImageUrl}
            onUpdateSplashImage={broadcastUpdateSplashImage}
          />
        ) : activeSection === "surveys" ? (
          /* ── Customer Ratings — grouped by coffee name ── */
          (() => {
            const coffeeGroups: Record<string, { total: number; count: number }> = {}
            reviewedOrders.forEach((o) => {
              const key = o.itemName || "Custom Coffee"
              if (!coffeeGroups[key]) coffeeGroups[key] = { total: 0, count: 0 }
              coffeeGroups[key].total += o.rating || 0
              coffeeGroups[key].count += 1
            })
            const grouped = Object.entries(coffeeGroups)
              .map(([name, { total, count }]) => ({
                name,
                count,
                avg: Math.round((total / count) * 10) / 10,
                orders: reviewedOrders.filter((o) => (o.itemName || "Custom Coffee") === name),
              }))
              .sort((a, b) => b.avg - a.avg)
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Customer Ratings</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{reviewedOrders.length} rating{reviewedOrders.length !== 1 ? "s" : ""} · grouped by coffee</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                </div>
                {grouped.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
                    <Star className="h-14 w-14 text-muted-foreground/30 mb-4" />
                    <p className="font-medium text-foreground">No ratings yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {grouped.map((g) => (
                      <div key={g.name} className="rounded-xl border border-border bg-card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">{g.name}</p>
                          <span className="text-xs text-muted-foreground">{g.count} rating{g.count !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < Math.round(g.avg) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                            ))}
                          </div>
                          <span className="text-sm font-bold text-foreground">{g.avg}</span>
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {g.orders.map((o) => (
                            <div key={o.id} className="flex items-center justify-between text-xs py-1 border-t border-border/50">
                              <span className="text-muted-foreground">{o.reviewerName || "Anonymous"}</span>
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < (o.rating || 0) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()
        ) : activeSection === "listoforders" ? (
          /* ── List of Orders — date range + category stats + drill-down ── */
          (() => {
            const start = orderFilterStart ? new Date(orderFilterStart + "T00:00:00") : null
            const end = orderFilterEnd ? new Date(orderFilterEnd + "T23:59:59") : null
            const filtered = orders.filter((o) => {
              const t = new Date(o.timestamp)
              if (start && t < start) return false
              if (end && t > end) return false
              if (statusFilter !== "all" && o.status !== statusFilter) return false
              return true
            })
            const catMap: Record<string, typeof orders> = {}
            filtered.forEach((o) => {
              const key = o.itemName || "Custom Coffee"
              if (!catMap[key]) catMap[key] = []
              catMap[key].push(o)
            })
            const categories = Object.entries(catMap).sort((a, b) => b[1].length - a[1].length)
            if (selectedCategory) {
              const catOrders = catMap[selectedCategory] || []
              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronLeft className="h-4 w-4" /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-foreground">{selectedCategory}</h1>
                    <span className="text-sm text-muted-foreground">({catOrders.length} orders)</span>
                  </div>
                  <div className="space-y-3">
                    {catOrders.map((o) => (
                      <div key={o.id} className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Order:</span> <span className="font-mono font-bold">{o.orderNumber ? formatOrderNumber(o.orderNumber) : o.id.slice(0,6).toUpperCase()}</span></div>
                        <div><span className="text-muted-foreground">Status:</span> <span className="capitalize font-medium">{o.status}</span></div>
                        <div><span className="text-muted-foreground">Strength:</span> <span className="capitalize">{o.coffeeStrength}</span></div>
                        <div><span className="text-muted-foreground">Sugar:</span> {o.sugarLevel}/5</div>
                        <div><span className="text-muted-foreground">Cup:</span> <span className="capitalize">{o.cupType}</span></div>
                        <div><span className="text-muted-foreground">Shot:</span> <span className="capitalize">{o.shot}</span></div>
                        {o.price && <div className="col-span-2"><span className="text-muted-foreground">Price:</span> {o.price}</div>}
                        <div className="col-span-2 text-xs text-muted-foreground">{new Date(o.timestamp).toLocaleString("tr-TR")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">List of Orders</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Filter by date range to see category stats</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
                {/* Date filter */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Date Range</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Başlangıç Tarihi (GG/AA/YYYY)</p>
                      <input
                        lang="tr"
                        type="date"
                        value={orderFilterStart}
                        onChange={(e) => setOrderFilterStart(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Bitiş Tarihi (GG/AA/YYYY)</p>
                      <input
                        lang="tr"
                        type="date"
                        value={orderFilterEnd}
                        onChange={(e) => setOrderFilterEnd(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="statusFilter"
                          checked={statusFilter === "all"}
                          onChange={() => setStatusFilter("all")}
                          className="text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-muted-foreground text-xs font-medium">All orders</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="statusFilter"
                          checked={statusFilter === "completed"}
                          onChange={() => setStatusFilter("completed")}
                          className="text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-muted-foreground text-xs font-medium">Completed</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="statusFilter"
                          checked={statusFilter === "cancelled"}
                          onChange={() => setStatusFilter("cancelled")}
                          className="text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-muted-foreground text-xs font-medium">Cancelled</span>
                      </label>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{filtered.length} orders found</span>
                      {(orderFilterStart || orderFilterEnd || statusFilter !== "all") && (
                        <button 
                          onClick={() => { setOrderFilterStart(""); setOrderFilterEnd(""); setStatusFilter("all"); }} 
                          className="text-primary hover:underline"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* Category grid */}
                {categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
                    <List className="h-14 w-14 text-muted-foreground/30 mb-4" />
                    <p className="font-medium text-foreground">No orders in this period</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {categories.map(([name, catOrds]) => {
                      const isLatte = name.toLowerCase() === "latte" || name.toLowerCase() === "iced latte"
                      return (
                      <button
                        key={name}
                        onClick={() => setSelectedCategory(name)}
                        className="rounded-xl border border-border bg-card p-5 text-left hover:bg-muted/50 hover:border-primary/40 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          {isLatte ? (
                            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20">
                              <Image src="/images/latte-hero.png" alt="Latte" width={40} height={40} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <Coffee className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <span className="text-3xl font-bold text-primary">{catOrds.length}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm truncate">{name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{catOrds.filter(o => o.status === "completed").length} completed · click to view</p>
                      </button>
                    )})}
                  </div>
                )}
                {/* Totals Section */}
                <div className="mt-10 pt-4 flex items-center justify-between border-t border-border">
                  <span className="text-lg font-bold text-foreground">Totals:</span>
                  <span className="text-xl font-bold text-primary">{filtered.length}</span>
                </div>
              </div>
            )
          })()
        ) : activeSection === "coffeemonth" ? (
          /* ── Coffee of the Month Management ── */
          <div className="space-y-6 max-w-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Coffee of the Month</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Update what customers see on the home screen</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Coffee className="h-6 w-6 text-primary" />
              </div>
            </div>
            {comSaved && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                ✅ Coffee of the Month updated! Customers will see the new selection.
              </div>
            )}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Coffee Name</label>
                <Input placeholder="e.g. Spanish Latte" value={comName} onChange={(e) => setComName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea placeholder="e.g. Sweet and creamier flavour" value={comDesc} onChange={(e) => setComDesc(e.target.value)} rows={3} className="resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Origin / Country</label>
                <Input placeholder="e.g. Spain" value={comOrigin} onChange={(e) => setComOrigin(e.target.value)} />
              </div>
              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cover Photo</label>
                <input
                  ref={comImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleComImageUpload}
                  className="hidden"
                />
                <div
                  onClick={() => comImageInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {comImageUrl ? (
                    <div className="relative w-full h-40">
                      <Image src={comImageUrl} alt="Cover" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                      <Coffee className="h-8 w-8" />
                      <p className="text-sm">Click to upload cover photo</p>
                      <p className="text-xs opacity-60">JPG, PNG, WebP</p>
                    </div>
                  )}
                </div>
                {comImageUrl && (
                  <button onClick={() => setComImageUrl(null)} className="text-xs text-destructive hover:underline">
                    Remove photo
                  </button>
                )}
              </div>
              <Button className="w-full" onClick={handleSaveCoffeeOfMonth} disabled={!comName.trim()}>
                <Coffee className="mr-2 h-4 w-4" /> Save Coffee of the Month
              </Button>
            </div>
            {/* Preview */}
            <div className="rounded-xl border border-primary/20 bg-card overflow-hidden">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 pt-4 pb-2">Preview (as seen by customers)</p>
              <div className="relative">
                {comImageUrl ? (
                  <div className="relative w-full h-36">
                    <Image src={comImageUrl} alt="Preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4">
                      <h3 className="text-xl font-bold text-white">{comName || "—"}</h3>
                      <p className="text-sm text-white/80">{comDesc || "—"}</p>
                      {comOrigin && <span className="inline-block mt-1 rounded-full border border-white/40 text-white px-2 py-0.5 text-xs">{comOrigin}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 space-y-2">
                    <h3 className="text-xl font-bold text-primary">{comName || "—"}</h3>
                    <p className="text-sm text-muted-foreground">{comDesc || "—"}</p>
                    {comOrigin && <span className="inline-block rounded-full border border-border px-2 py-0.5 text-xs">{comOrigin}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeSection === "users" ? (
          /* ── Customers Section ── */
          (() => {
            const allUsers: { email: string; name: string; surname: string }[] = (() => {
              try { return JSON.parse(localStorage.getItem("cc_users") || "[]") } catch { return [] }
            })()
            const filtered = allUsers.filter((u) => {
              const q = customerSearch.toLowerCase()
              return (
                u.name.toLowerCase().includes(q) ||
                u.surname.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
              )
            })
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Customers</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Registered customer count: <span className="font-semibold text-foreground">{allUsers.length}</span>
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email…"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {/* Grid */}
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
                    <Users className="h-14 w-14 text-muted-foreground/30 mb-4" />
                    <p className="font-medium text-foreground">{allUsers.length === 0 ? "No registered customers yet" : "No results found"}</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((u) => (
                      <div key={u.email} className="rounded-xl border border-border bg-card p-5 space-y-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 mb-3">
                          <span className="text-sm font-bold text-primary">{u.name[0]}{u.surname[0]}</span>
                        </div>
                        <p className="font-semibold text-foreground">{u.name} {u.surname}</p>
                        <p className="text-xs text-muted-foreground break-all">{u.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()
        ) : activeSection === "account" ? (
          /* ── Barista Account — Change PIN ── */
          <div className="space-y-6 max-w-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Barista Account</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Manage panel access settings</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* Change PIN Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Change Barista PIN</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Only the authorized admin can create a new barista login code.
              </p>

              {acPinSaved && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  PIN successfully updated! New code is active.
                </div>
              )}

              {acError && (
                <p className="text-xs text-destructive">{acError}</p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" /> Admin E-mail
                </label>
                <Input
                  type="email"
                  placeholder="Admin e-posta adresi"
                  value={acAdminEmail}
                  onChange={(e) => { setAcAdminEmail(e.target.value); setAcError("") }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Security Code
                </label>
                <Input
                  type="password"
                  placeholder="Güvenlik kodu"
                  value={acSecurityCode}
                  onChange={(e) => { setAcSecurityCode(e.target.value); setAcError("") }}
                />
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">New Barista PIN</label>
                  <div className="relative">
                    <Input
                      type={acShowNewPin ? "text" : "password"}
                      placeholder="New PIN (at least 4 characters)"
                      value={acNewPin}
                      onChange={(e) => { setAcNewPin(e.target.value); setAcError("") }}
                      className="pr-10 tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setAcShowNewPin(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {acShowNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirm New PIN</label>
                  <Input
                    type="password"
                    placeholder="Confirm PIN"
                    value={acConfirmPin}
                    onChange={(e) => { setAcConfirmPin(e.target.value); setAcError("") }}
                    className="tracking-widest"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleChangeBaristaPin}
                disabled={!acAdminEmail || !acSecurityCode || !acNewPin || !acConfirmPin}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Create New Code
              </Button>
            </div>
          </div>
        ) : (
          /* ── Placeholder for other sections ── */
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              {(() => {
                const item = sidebarItems.find((s) => s.id === activeSection)
                const Icon = item?.icon
                return Icon ? <Icon className="h-9 w-9 text-muted-foreground" /> : null
              })()}
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {sidebarItems.find((s) => s.id === activeSection)?.label}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Bu özellik yakında eklenecek.</p>
          </div>
        )}
      </main>
    </div>
  )
}
