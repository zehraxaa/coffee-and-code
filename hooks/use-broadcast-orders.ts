"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Order, OrderStatus } from "@/lib/types"

type BroadcastMessage =
  | { type: "ORDER_PLACED"; order: Order }
  | { type: "ORDER_STATUS_UPDATED"; orderId: string; status: OrderStatus }
  | { type: "ORDER_RATED"; orderId: string; rating: number; review: string; reviewerName?: string }
  | { type: "SYNC_REQUEST" }
  | { type: "SYNC_RESPONSE"; orders: Order[] }

const CHANNEL_NAME = "coffee_and_code_orders"

export function useBroadcastOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const channelRef = useRef<BroadcastChannel | null>(null)
  const ordersRef = useRef<Order[]>([])

  // ordersRef'i güncel tut — SYNC_RESPONSE için
  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  useEffect(() => {
    if (typeof window === "undefined") return

    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const msg = event.data

      switch (msg.type) {
        case "ORDER_PLACED":
          setOrders((prev) => {
            if (prev.find((o) => o.id === msg.order.id)) return prev
            return [msg.order, ...prev]
          })
          break

        case "ORDER_STATUS_UPDATED":
          setOrders((prev) =>
            prev.map((o) => (o.id === msg.orderId ? { ...o, status: msg.status } : o))
          )
          break

        case "ORDER_RATED":
          setOrders((prev) =>
            prev.map((o) =>
              o.id === msg.orderId ? { ...o, rating: msg.rating, review: msg.review, reviewerName: msg.reviewerName } : o
            )
          )
          break

        case "SYNC_REQUEST":
          // Mevcut state'i yeni açılan sekmeye gönder
          channel.postMessage({
            type: "SYNC_RESPONSE",
            orders: ordersRef.current,
          } as BroadcastMessage)
          break

        case "SYNC_RESPONSE":
          // Sadece boşsak al (ilk açılış)
          setOrders((prev) => (prev.length > 0 ? prev : msg.orders))
          break
      }
    }

    // Açılışta mevcut sekmelerden veri iste
    channel.postMessage({ type: "SYNC_REQUEST" } as BroadcastMessage)

    return () => {
      channel.close()
    }
  }, [])

  const broadcastPlaceOrder = useCallback((order: Order) => {
    setOrders((prev) => {
      if (prev.find((o) => o.id === order.id)) return prev
      return [order, ...prev]
    })
    channelRef.current?.postMessage({ type: "ORDER_PLACED", order } as BroadcastMessage)
  }, [])

  const broadcastUpdateStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    )
    channelRef.current?.postMessage({
      type: "ORDER_STATUS_UPDATED",
      orderId,
      status,
    } as BroadcastMessage)
  }, [])

  const broadcastRateOrder = useCallback((orderId: string, rating: number, review: string, reviewerName?: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, rating, review, reviewerName } : o))
    )
    channelRef.current?.postMessage({
      type: "ORDER_RATED",
      orderId,
      rating,
      review,
      reviewerName,
    } as BroadcastMessage)
  }, [])

  return { orders, broadcastPlaceOrder, broadcastUpdateStatus, broadcastRateOrder }
}
