"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
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
  Trash2,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatOrderNumber } from "@/lib/order-number"

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
  { id: "account", label: "Barista Account", icon: UserCog },
  { id: "surveys", label: "Customer Feedback", icon: ClipboardList },
]

export default function BaristaPage() {
  const { orders, broadcastUpdateStatus, broadcastDeleteReview } = useBroadcastOrders()
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState("orders")

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

  const handleDeleteReview = (orderId: string) => {
    broadcastDeleteReview(orderId)
    toast({
      title: "Review Removed",
      description: "The review has been deleted.",
    })
  }

  // Tüm yorumları (rating olan siparişler)
  const reviewedOrders = orders.filter((o) => o.rating && o.review)

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
        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">Coffee & Code · Barista Panel</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {activeSection === "orders" ? (
          <BaristaDashboard orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
        ) : activeSection === "surveys" ? (
          /* ── Customer Feedback Section ── */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Customer Feedback</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {reviewedOrders.length} review{reviewedOrders.length !== 1 ? "s" : ""} total · You can delete inappropriate reviews
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
            </div>

            {reviewedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
                <Star className="h-14 w-14 text-muted-foreground/30 mb-4" />
                <p className="font-medium text-foreground">No reviews yet</p>
                <p className="text-sm text-muted-foreground mt-1">Customer reviews will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {reviewedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border bg-card p-5 space-y-3 hover:shadow-md transition-shadow"
                  >
                    {/* Order info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-muted-foreground">
                          {order.orderNumber ? formatOrderNumber(order.orderNumber) : order.id.slice(0, 6).toUpperCase()}
                        </p>
                        <p className="font-semibold text-foreground truncate">
                          {order.itemName || "Custom Coffee"}
                        </p>
                      </div>
                      {/* Stars */}
                      <div className="flex gap-0.5 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < (order.rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-muted text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Reviewer */}
                    <p className="text-xs text-muted-foreground">
                      By <span className="font-medium text-foreground">{order.reviewerName || "Anonymous"}</span>
                    </p>

                    {/* Review text */}
                    {order.review && (
                      <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-3 italic">
                        &ldquo;{order.review}&rdquo;
                      </p>
                    )}

                    {/* Delete button */}
                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
                        onClick={() => handleDeleteReview(order.id)}
                      >
                        <Trash2 className="mr-1.5 h-3 w-3" />
                        Delete Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
