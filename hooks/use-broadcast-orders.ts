"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Order, OrderStatus } from "@/lib/types"
import { supabase } from "@/lib/supabase"

type UseBroadcastOrdersOptions = {
  observeBaristaPresence?: boolean
  /**
   * "barista" → tüm siparişleri çek (barista paneli için)
   * "customer" (default) → sadece bu kullanıcının tüm geçmiş siparişlerini çek
   */
  mode?: "barista" | "customer"
  enabled?: boolean
}

// ── Misafir oturum ID'sini yöneten yardımcı ────────────────────────────────
function getGuestSessionId(): string | null {
  if (typeof window === "undefined") return null
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

export function useBroadcastOrders({
  observeBaristaPresence = true,
  mode = "customer",
  enabled = true,
}: UseBroadcastOrdersOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const isBaristaOnlineRef = useRef(false)

  // ── 1. Oturum durumunu (Müşteri UUID veya Misafir ID) dinle ───────────────
  useEffect(() => {
    if (!enabled) return

    // İlk oturumu al
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id)
      } else {
        setCurrentUserId(getGuestSessionId())
      }
    }).catch(err => {
      console.error("Error getting session in hook:", err)
    })

    // Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id)
      } else {
        setCurrentUserId(getGuestSessionId())
      }
    })

    return () => subscription.unsubscribe()
  }, [enabled])

  // ── 2. Siparişleri Supabase'den çek ve Realtime dinle ────────────────────
  useEffect(() => {
    if (!enabled) return
    if (mode === "customer" && !currentUserId) return

    const fetchOrders = async () => {
      if (mode === "customer" && currentUserId && currentUserId.startsWith("guest_")) {
        let guestOrderIds: string[] = []
        try {
          const stored = typeof window !== "undefined" ? localStorage.getItem("cc_guest_order_ids") : null
          if (stored) {
            guestOrderIds = JSON.parse(stored)
            if (!Array.isArray(guestOrderIds)) guestOrderIds = []
          }
        } catch (e) {
          console.error("Error parsing guest order IDs:", e)
        }

        if (guestOrderIds.length === 0) {
          setOrders([])
          return
        }

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .in("id", guestOrderIds)
          .order("created_at", { ascending: false })

        if (!error && data) {
          setOrders(data.map(mapRow))
        } else if (error) {
          console.error("Error fetching orders:", error.message || error)
        }
        return
      }

      let query = supabase.from("orders").select("*")

      // Müşteri ise sadece kendi geçmiş siparişlerini çek (tarih sınırlaması yok!)
      if (mode === "customer") {
        query = query.eq("user_id", currentUserId)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (!error && data) {
        setOrders(data.map(mapRow))
      } else if (error) {
        console.error("Error fetching orders:", error.message || error)
      }
    }

    fetchOrders()

    const channelId = crypto.randomUUID()
    const channel = supabase
      .channel(`orders-realtime-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const o = payload.new as Record<string, unknown>
            
            // Güvenlik ve İzolasyon: Müşteri ise sadece kendi siparişlerini listeye ekle
            if (mode === "customer") {
              if (currentUserId && currentUserId.startsWith("guest_")) {
                let guestOrderIds: string[] = []
                try {
                  const stored = typeof window !== "undefined" ? localStorage.getItem("cc_guest_order_ids") : null
                  if (stored) {
                    guestOrderIds = JSON.parse(stored)
                    if (!Array.isArray(guestOrderIds)) guestOrderIds = []
                  }
                } catch (e) {
                  console.error("Error parsing guest order IDs in listener:", e)
                }
                if (!guestOrderIds.includes(o.id as string)) {
                  return
                }
              } else if (o.user_id !== currentUserId) {
                return
              }
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
  }, [mode, observeBaristaPresence, currentUserId, enabled])

  // ── Sipariş ver ────────────────────────────────────────────────────
  const broadcastPlaceOrder = useCallback(
    async (order: Order) => {
      // Optimistic UI update
      setOrders((prev) => {
        if (prev.find((o) => o.id === order.id)) return prev
        return [order, ...prev]
      })

      // Misafir siparişi ise, sipariş ID'sini localStorage'e kaydet
      if (order.isGuest && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("cc_guest_order_ids")
          const ids: string[] = stored ? JSON.parse(stored) : []
          if (Array.isArray(ids) && !ids.includes(order.id)) {
            ids.push(order.id)
            localStorage.setItem("cc_guest_order_ids", JSON.stringify(ids))
          }
        } catch (e) {
          console.error("Error storing guest order ID:", e)
        }
      }

      const insertData: Record<string, unknown> = {
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
        status: order.status,
        price: order.price,
        note: order.note || null,
      }

      if (order.userId && !order.userId.startsWith("guest_")) {
        insertData.user_id = order.userId
      }

      let { error } = await supabase.from("orders").insert(insertData)

      // user_id kolonu yoksa fallback olarak kolonsuz tekrar dene
      if (error && error.message?.includes("user_id")) {
        delete insertData.user_id
        const retry = await supabase.from("orders").insert(insertData)
        error = retry.error
      }

      if (error) {
        console.error("Error inserting order:", error.message || error)
      } else {
        // Give presence state 2 seconds to sync, then decide whether to email
        setTimeout(() => {
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
        }, 2000)
      }
    },
    []
  )

  // ── Sipariş durumunu güncelle ──────────────────────────────────────
  const broadcastUpdateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    // Find the order before updating local state
    setOrders((prev) => {
      const order = prev.find(o => o.id === orderId)
      
      // Eğer sipariş 'completed' yapılıyorsa ve kayıtlı kullanıcı siparişiyse (Barista işlemi)
      if (status === "completed" && order && !order.isGuest && order.userId) {
        // Barista, kullanıcının stamp sayısını veritabanında günceller.
        // Bu sayede müşteri uygulamayı aç-kapa yapsa bile stamp'i kalıcı olur ve mükerrer stamp verilmez.
        supabase.from('profiles').select('loyalty_stamps').eq('id', order.userId).single()
          .then(({ data: profile }) => {
            if (profile) {
              const next = (profile.loyalty_stamps || 0) + 1
              const finalStamps = next >= 8 ? 8 : next
              supabase.from('profiles').update({ loyalty_stamps: finalStamps }).eq('id', order.userId).then()
            }
          })
      }

      return prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    })

    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)
    if (error) console.error("Error updating order status:", error.message || error)
  }, [])

  // ── Siparişi puanla ───────────────────────────────────────────────
  const broadcastRateOrder = useCallback(
    async (orderId: string, rating: number, review: string, reviewerName?: string) => {
      // Optimistic UI update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, rating, reviewerName } : o))
      )

      // 'review' kolonu şemada yok — sadece rating ve reviewer_name güncelle
      const { error } = await supabase
        .from("orders")
        .update({ rating, reviewer_name: reviewerName || null })
        .eq("id", orderId)

      if (error) console.error("Error rating order:", error.message || error)
    },
    []
  )

  // ── Yorumu sil ────────────────────────────────────────────────────
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
    if (error) console.error("Error deleting review:", error.message || error)
  }, [])

  return {
    orders,
    broadcastPlaceOrder,
    broadcastUpdateStatus,
    broadcastRateOrder,
    broadcastDeleteReview,
  }
}
