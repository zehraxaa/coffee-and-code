"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Order, OrderStatus } from "@/lib/types"
import { supabase } from "@/lib/supabase"

type UseBroadcastOrdersOptions = {
  observeBaristaPresence?: boolean
}

export function useBroadcastOrders({ observeBaristaPresence = true }: UseBroadcastOrdersOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([])
  const isBaristaOnlineRef = useRef(false)

  useEffect(() => {
    // 1. İlk açılışta mevcut siparişleri Supabase'den çek
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        const mappedOrders: Order[] = data.map(o => ({
          id: o.id,
          timestamp: new Date(o.created_at),
          orderNumber: o.order_number,
          itemName: o.item_name,
          coffeeStrength: o.coffee_strength as Order["coffeeStrength"],
          sugarLevel: o.sugar_level,
          shot: o.shot as "single" | "double",
          milkType: o.milk_type as "whole" | "lactose-free" | "oat" | undefined,
          cupType: o.cup_type as "paper" | "plastic" | "glass" | "porcelain",
          cupSize: o.cup_size as "small" | "medium" | "large",
          syrups: o.syrups || [],
          chocolateType: o.chocolate_type as "white" | "milk" | "dark" | undefined,
          isGuest: o.is_guest,
          status: o.status as OrderStatus,
          rating: o.rating || undefined,
          review: o.review || undefined,
          reviewerName: o.reviewer_name || undefined,
          price: o.price,
          note: o.note || undefined,
        }))
        setOrders(mappedOrders)
      } else if (error) {
        console.error("Error fetching initial orders:", error)
      }
    }
    
    fetchOrders()

    // 2. Realtime değişiklikleri (diğer cihazlardan gelen) dinle
    const channelId = crypto.randomUUID()
    const channel = supabase.channel(`schema-db-changes-${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const o = payload.new
            const newOrder: Order = {
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
              status: o.status,
              rating: o.rating || undefined,
              review: o.review || undefined,
              reviewerName: o.reviewer_name || undefined,
              price: o.price,
              note: o.note || undefined,
            }
            setOrders(prev => {
              // Kendimiz eklediysek (optimistic update) zaten vardır, atla
              if (prev.find(item => item.id === newOrder.id)) return prev;
              return [newOrder, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const o = payload.new
            setOrders(prev => prev.map(item => {
              if (item.id === o.id) {
                return {
                  ...item,
                  status: o.status,
                  rating: o.rating || undefined,
                  review: o.review || undefined,
                  reviewerName: o.reviewer_name || undefined,
                }
              }
              return item
            }))
          } else if (payload.eventType === 'DELETE') {
             setOrders(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // 3. Barista çevrimiçi durumunu dinle
    const presenceChannel = observeBaristaPresence ? supabase.channel('barista_presence') : null
    presenceChannel
      ?.on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        isBaristaOnlineRef.current = Object.keys(state).length > 0
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel)
      }
    }
  }, [observeBaristaPresence])

  const broadcastPlaceOrder = useCallback(async (order: Order) => {
    // Optimistic UI update: Anında arayüzde göster
    setOrders((prev) => {
      if (prev.find((o) => o.id === order.id)) return prev
      return [order, ...prev]
    })
    
    // Supabase'e kaydet
    const { error } = await supabase.from('orders').insert({
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
    })

    if (error) {
      console.error("Error inserting order:", error)
    } else {
      if (!isBaristaOnlineRef.current) {
        fetch('/api/notify-barista', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order })
        })
          .then(async (response) => {
            if (!response.ok) {
              const body = await response.text()
              console.error("Error sending email notification:", response.status, body)
            }
          })
          .catch(err => console.error("Error sending email notification:", err))
      }
    }
  }, [])

  const broadcastUpdateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    )
    
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) {
      console.error("Error updating order status:", error)
    }
  }, [])

  const broadcastRateOrder = useCallback(async (orderId: string, rating: number, review: string, reviewerName?: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, rating, review, reviewerName } : o))
    )
    
    const { error } = await supabase.from('orders').update({ 
      rating, 
      review: review || null, 
      reviewer_name: reviewerName || null 
    }).eq('id', orderId)
    
    if (error) {
      console.error("Error rating order:", error)
    }
  }, [])

  const broadcastDeleteReview = useCallback(async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, rating: undefined, review: undefined, reviewerName: undefined } : o))
    )
    
    const { error } = await supabase.from('orders').update({ 
      rating: null, 
      review: null, 
      reviewer_name: null 
    }).eq('id', orderId)
    
    if (error) {
      console.error("Error deleting review:", error)
    }
  }, [])

  return { orders, broadcastPlaceOrder, broadcastUpdateStatus, broadcastRateOrder, broadcastDeleteReview }
}
