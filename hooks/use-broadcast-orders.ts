"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Order, OrderStatus } from "@/lib/types"
import { supabase } from "@/lib/supabase"

type UseBroadcastOrdersOptions = {
  observeBaristaPresence?: boolean
  /**
   * "barista" → tüm siparişleri çek (barista paneli için)
   * "customer" (default) → sadece bu kullanıcının siparişlerini çek
   */
  mode?: "barista" | "customer"
}

// ── Misafir kullanıcı için geçici ama oturum boyunca sabit ID ──────────────
function getGuestSessionId(): string {
  if (typeof window === "undefined") return "guest_ssr"
  const key = "cc_guest_session_id"
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = "guest_" + crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

// ── Ham Supabase satırını Order nesnesine dönüştür ─────────────────────────
function mapRow(o: Record<string, unknown>): Order {
  return {
    id: o.id as string,
    timestamp: new Date(o.created_at as string),
    orderNumber: o.order_number as number | undefined,
    itemName: o.item_name as string | undefined,
    coffeeStrength: o.coffee_strength as Order["coffeeStrength"],
    sugarLevel: o.sugar_level as number,
    shot: o.shot as "single" | "double",
    milkType: (o.milk_type as Order["milkType"]) || undefined,
    cupType: o.cup_type as Order["cupType"],
    cupSize: o.cup_size as Order["cupSize"],
    syrups: (o.syrups as string[]) || [],
    chocolateType: (o.chocolate_type as Order["chocolateType"]) || undefined,
    isGuest: o.is_guest as boolean,
    userId: (o.user_id as string) || undefined,
    status: o.status as OrderStatus,
    rating: (o.rating as number) || undefined,
    review: (o.review as string) || undefined,
    reviewerName: (o.reviewer_name as string) || undefined,
    price: o.price as string | undefined,
    note: (o.note as string) || undefined,
  }
}

// ── Bugünün başlangıcını yerel saate göre ISO olarak döndür ───────────────
function getTodayStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

// ── Bir siparişin bugüne ait olup olmadığını kontrol et ───────────────────
function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function useBroadcastOrders({
  observeBaristaPresence = true,
  mode = "customer",
}: UseBroadcastOrdersOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([])
  const isBaristaOnlineRef = useRef(false)

  // Supabase Auth'dan gelen kullanıcı UUID'si (null = misafir veya henüz belli değil)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Auth durumunu takip et
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUserId(session?.user?.id ?? null)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // ── Kullanıcı kimliğini belirle ───────────────────────────────────────
    // Barista modunda kullanıcı filtresi uygulanmaz.
    // Customer modunda: oturum açmışsa UUID, misafiryse sessionStorage ID.
    let effectiveUserId: string | null = null
    if (mode === "customer") {
      effectiveUserId = currentUserId ?? getGuestSessionId()
    }

    // ── 1. İlk yükleme: siparişleri Supabase'den çek ─────────────────────
    const fetchOrders = async () => {
      let query = supabase
        .from("orders")
        .select("*")
        .gte("created_at", getTodayStart())
        .order("created_at", { ascending: false })

      // Müşteri modunda sadece kendi siparişleri
      if (mode === "customer" && effectiveUserId) {
        query = query.eq("user_id", effectiveUserId)
      }

      const { data, error } = await query

      if (!error && data) {
        setOrders(data.map(mapRow))
      } else if (error) {
        console.error("Error fetching orders:", error)
      }
    }

    fetchOrders()

    // ── 2. Realtime değişiklikleri dinle ──────────────────────────────────
    const channelId = crypto.randomUUID()
    const channel = supabase
      .channel(`orders-realtime-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const o = payload.new as Record<string, unknown>

            // Bugün değilse yoksay
            if (!isToday(o.created_at as string)) return

            // Müşteri modunda: sadece kendi siparişini ekle
            if (mode === "customer" && effectiveUserId) {
              if ((o.user_id as string) !== effectiveUserId) return
            }

            const newOrder = mapRow(o)
            setOrders((prev) => {
              if (prev.find((item) => item.id === newOrder.id)) return prev
              return [newOrder, ...prev]
            })
          } else if (payload.eventType === "UPDATE") {
            const o = payload.new as Record<string, unknown>
            setOrders((prev) =>
              prev.map((item) => {
                if (item.id !== (o.id as string)) return item
                // Müşteri modunda: güncelleme kendi siparişine aitse işle
                if (mode === "customer" && effectiveUserId) {
                  if ((o.user_id as string) !== effectiveUserId) return item
                }
                return {
                  ...item,
                  status: o.status as OrderStatus,
                  rating: (o.rating as number) || undefined,
                  review: (o.review as string) || undefined,
                  reviewerName: (o.reviewer_name as string) || undefined,
                }
              })
            )
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) =>
              prev.filter((item) => item.id !== (payload.old as Record<string, unknown>).id)
            )
          }
        }
      )
      .subscribe()

    // ── 3. Barista çevrimiçi durumunu dinle ───────────────────────────────
    const presenceChannel = observeBaristaPresence
      ? supabase.channel("barista_presence")
      : null
    presenceChannel
      ?.on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState()
        isBaristaOnlineRef.current = Object.keys(state).length > 0
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (presenceChannel) supabase.removeChannel(presenceChannel)
    }
  }, [mode, observeBaristaPresence, currentUserId])

  // ── Sipariş ver ────────────────────────────────────────────────────────
  const broadcastPlaceOrder = useCallback(
    async (order: Order) => {
      // Optimistic UI update
      setOrders((prev) => {
        if (prev.find((o) => o.id === order.id)) return prev
        return [order, ...prev]
      })

      // user_id: giriş yapmış kullanıcı UUID veya misafir session ID
      const userId = order.userId ?? (order.isGuest ? getGuestSessionId() : null)

      const { error } = await supabase.from("orders").insert({
        id: order.id,
        order_number: order.orderNumber,
        item_name: order.itemName,
        coffee_strength: order.coffeeStrength,
        sugar_level: order.sugarLevel,
        shot: order.shot,
        milk_type: order.milkType || null,
        cup_type: order.cupType,
        cup_size: order.cupSize,
        syrups: order.syrups,
        chocolate_type: order.chocolateType || null,
        is_guest: order.isGuest || false,
        user_id: userId,
        status: order.status,
        price: order.price,
        note: order.note || null,
      })

      if (error) {
        console.error("Error inserting order:", error)
      } else {
        if (!isBaristaOnlineRef.current) {
          fetch("/api/notify-barista", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order }),
          })
            .then(async (response) => {
              if (!response.ok) {
                const body = await response.text()
                console.error("Error sending email notification:", response.status, body)
              }
            })
            .catch((err) => console.error("Error sending email notification:", err))
        }
      }
    },
    []
  )

  // ── Sipariş durumunu güncelle ──────────────────────────────────────────
  const broadcastUpdateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)
    if (error) console.error("Error updating order status:", error)
  }, [])

  // ── Siparişi puanla ───────────────────────────────────────────────────
  const broadcastRateOrder = useCallback(
    async (orderId: string, rating: number, review: string, reviewerName?: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, rating, review, reviewerName } : o))
      )
      const { error } = await supabase
        .from("orders")
        .update({ rating, review: review || null, reviewer_name: reviewerName || null })
        .eq("id", orderId)
      if (error) console.error("Error rating order:", error)
    },
    []
  )

  // ── Yorumu sil ────────────────────────────────────────────────────────
  const broadcastDeleteReview = useCallback(async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, rating: undefined, review: undefined, reviewerName: undefined }
          : o
      )
    )
    const { error } = await supabase
      .from("orders")
      .update({ rating: null, review: null, reviewer_name: null })
      .eq("id", orderId)
    if (error) console.error("Error deleting review:", error)
  }, [])

  return {
    orders,
    broadcastPlaceOrder,
    broadcastUpdateStatus,
    broadcastRateOrder,
    broadcastDeleteReview,
  }
}
