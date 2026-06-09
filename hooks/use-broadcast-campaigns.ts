"use client"

import { useState, useCallback, useSyncExternalStore } from "react"
import type { Campaign } from "@/lib/types"
import { supabase } from "@/lib/supabase"

// ── Singleton store ──────────────────────────────────────────────
// All hook instances share the same data via this module-level store.
let _campaigns: Campaign[] = []
let _splashImageUrl: string | null = null
let _loading = true
let _initialized = false
let _listeners: Set<() => void> = new Set()
let _realtimeChannel: ReturnType<typeof supabase.channel> | null = null

function notify() {
  _listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  _listeners.add(listener)
  return () => { _listeners.delete(listener) }
}

// Snapshot selectors
function getCampaignsSnapshot() { return _campaigns }
function getSplashSnapshot() { return _splashImageUrl }
function getLoadingSnapshot() { return _loading }

function mapCampaign(c: any): Campaign {
  return {
    id: c.id,
    title: c.title,
    description: c.description || "",
    expiresAt: c.expires_at,
    startDate: c.start_date || undefined,
    endDate: c.end_date || undefined,
    startTime: c.start_time || undefined,
    endTime: c.end_time || undefined,
    activeDays: c.active_days || undefined,
    applicableItemIds: c.applicable_item_ids || [],
    discountPercent: c.discount_percent,
    sortOrder: c.sort_order ?? 0,
    imageUrl: c.image_url || undefined,
    createdAt: c.created_at,
  }
}

function sortByCampaignOrder(list: Campaign[]): Campaign[] {
  return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

async function initStore() {
  if (_initialized) return
  _initialized = true

  // Fetch campaigns — ordered by sort_order
  const { data: campData } = await supabase
    .from('campaigns')
    .select('*')
    .order('sort_order', { ascending: true })
  if (campData) {
    const now = new Date()
    _campaigns = sortByCampaignOrder(
      campData.map(mapCampaign).filter(c => new Date(c.expiresAt) > now)
    )
  }

  // Fetch splash image
  const { data: splashData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'splash_image')
    .single()
  if (splashData?.value?.url) {
    _splashImageUrl = splashData.value.url
  }

  _loading = false
  notify()

  // Realtime listener
  const channelId = crypto.randomUUID()
  _realtimeChannel = supabase.channel(`campaigns-db-changes-${channelId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newCamp = mapCampaign(payload.new)
        if (!_campaigns.find(c => c.id === newCamp.id)) {
          _campaigns = sortByCampaignOrder([newCamp, ..._campaigns])
          notify()
        }
      } else if (payload.eventType === 'UPDATE') {
        _campaigns = sortByCampaignOrder(_campaigns.map(item =>
          item.id === payload.new.id ? mapCampaign(payload.new) : item
        ))
        notify()
      } else if (payload.eventType === 'DELETE') {
        _campaigns = _campaigns.filter(item => item.id !== payload.old.id)
        notify()
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: "key=eq.splash_image" }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        _splashImageUrl = payload.new?.value?.url || null
      }
      notify()
    })
    .subscribe()
}

// Start fetching immediately when module is imported (not after React mounts)
if (typeof window !== "undefined") {
  initStore()
}

// ── Hook ─────────────────────────────────────────────────────────
export function useBroadcastCampaigns() {

  // Subscribe to store updates
  const campaigns = useSyncExternalStore(subscribe, getCampaignsSnapshot, getCampaignsSnapshot)
  const splashImageUrl = useSyncExternalStore(subscribe, getSplashSnapshot, getSplashSnapshot)
  const loading = useSyncExternalStore(subscribe, getLoadingSnapshot, getLoadingSnapshot)

  /** Verilen item ID'sine uygulanan aktif kampanyayı döner */
  const getActiveCampaignForItem = useCallback(
    (itemId: string): Campaign | undefined => {
      const now = new Date()
      return campaigns.find((c) => {
        // Kampanya süresi dolmuş mu?
        if (new Date(c.expiresAt) <= now) return false

        // Ürün eşleşiyor mu?
        const itemMatch =
          c.applicableItemIds.includes(itemId) ||
          c.applicableItemIds.includes("all")
        if (!itemMatch) return false

        // Tarih aralığı kontrolü (gün bazında)
        if (c.startDate && c.endDate) {
          const todayStr = now.toISOString().split("T")[0] // "YYYY-MM-DD"
          if (todayStr < c.startDate || todayStr > c.endDate) return false
        }

        // Gün kontrolü — seçili günler varsa sadece o günler indirim aktif
        if (c.activeDays && c.activeDays.length > 0) {
          const todayDow = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
          if (!c.activeDays.includes(todayDow)) return false
        }

        // Saat aralığı kontrolü — sadece belirtilen saatler arasında indirim aktif
        if (c.startTime && c.endTime) {
          const [sh, sm] = c.startTime.split(":").map(Number)
          const [eh, em] = c.endTime.split(":").map(Number)
          const nowMins = now.getHours() * 60 + now.getMinutes()
          const startMins = sh * 60 + sm
          const endMins = eh * 60 + em
          if (nowMins < startMins || nowMins > endMins) return false
        }

        return true
      })
    },
    [campaigns]
  )

  /** Verilen base fiyatına kampanya indirimini uygular */
  const applyDiscount = useCallback(
    (basePriceTL: number | string, itemId: string): { finalPrice: number; discount: number; campaign?: Campaign } => {
      const numericPrice = typeof basePriceTL === "string" ? parseInt(basePriceTL.replace(/[^0-9]/g, ""), 10) || 0 : basePriceTL
      const campaign = getActiveCampaignForItem(itemId)
      if (!campaign) return { finalPrice: numericPrice, discount: 0 }
      const discount = Math.round(numericPrice * (campaign.discountPercent / 100))
      return { finalPrice: numericPrice - discount, discount, campaign }
    },
    [getActiveCampaignForItem]
  )

  const broadcastCreateCampaign = useCallback(async (campaign: Campaign) => {
    // Assign sort_order = max existing + 1
    const maxOrder = _campaigns.reduce((m, c) => Math.max(m, c.sortOrder ?? 0), -1)
    const withOrder = { ...campaign, sortOrder: maxOrder + 1 }
    // Optimistic
    if (!_campaigns.find(c => c.id === campaign.id)) {
      _campaigns = sortByCampaignOrder([withOrder, ..._campaigns])
      notify()
    }

    const { error } = await supabase.from('campaigns').insert({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      expires_at: campaign.expiresAt,
      start_date: campaign.startDate || null,
      end_date: campaign.endDate || null,
      start_time: campaign.startTime || null,
      end_time: campaign.endTime || null,
      active_days: campaign.activeDays && campaign.activeDays.length > 0 ? campaign.activeDays : null,
      applicable_item_ids: campaign.applicableItemIds,
      discount_percent: campaign.discountPercent,
      sort_order: maxOrder + 1,
      image_url: campaign.imageUrl || null,
    })
    if (error) console.error("Error creating campaign:", error)
  }, [])

  const broadcastUpdateCampaign = useCallback(async (campaign: Campaign) => {
    // Optimistic
    _campaigns = _campaigns.map(c => c.id === campaign.id ? campaign : c)
    notify()

    const { error } = await supabase.from('campaigns').update({
      title: campaign.title,
      description: campaign.description,
      expires_at: campaign.expiresAt,
      start_date: campaign.startDate || null,
      end_date: campaign.endDate || null,
      start_time: campaign.startTime || null,
      end_time: campaign.endTime || null,
      active_days: campaign.activeDays && campaign.activeDays.length > 0 ? campaign.activeDays : null,
      applicable_item_ids: campaign.applicableItemIds,
      discount_percent: campaign.discountPercent,
      image_url: campaign.imageUrl || null,
    }).eq('id', campaign.id)
    if (error) console.error("Error updating campaign:", error)
  }, [])

  const broadcastDeleteCampaign = useCallback(async (campaignId: string) => {
    // Optimistic
    _campaigns = _campaigns.filter(c => c.id !== campaignId)
    notify()

    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId)
    if (error) console.error("Error deleting campaign:", error)
  }, [])

  /** Move a campaign one step up or down in the display order */
  const reorderCampaign = useCallback(async (id: string, direction: "up" | "down") => {
    const sorted = sortByCampaignOrder(_campaigns)
    const idx = sorted.findIndex(c => c.id === id)
    const targetIdx = direction === "up" ? idx - 1 : idx + 1
    if (idx < 0 || targetIdx < 0 || targetIdx >= sorted.length) return

    const item = sorted[idx]
    const target = sorted[targetIdx]
    const myOrder = item.sortOrder ?? idx
    const targetOrder = target.sortOrder ?? targetIdx

    // If orders are equal, re-index first
    if (myOrder === targetOrder) {
      const updates = sorted.map((c, i) => ({ id: c.id, sort_order: i }))
      for (const u of updates) {
        await supabase.from('campaigns').update({ sort_order: u.sort_order }).eq('id', u.id)
      }
      const { data } = await supabase.from('campaigns').select('*').order('sort_order', { ascending: true })
      if (data) {
        const now = new Date()
        _campaigns = sortByCampaignOrder(data.map(mapCampaign).filter(c => new Date(c.expiresAt) > now))
        notify()
      }
      return
    }

    // Optimistic swap
    _campaigns = sortByCampaignOrder(
      _campaigns.map(c => {
        if (c.id === item.id) return { ...c, sortOrder: targetOrder }
        if (c.id === target.id) return { ...c, sortOrder: myOrder }
        return c
      })
    )
    notify()

    // Persist
    await supabase.from('campaigns').update({ sort_order: targetOrder }).eq('id', item.id)
    await supabase.from('campaigns').update({ sort_order: myOrder }).eq('id', target.id)
  }, [])

  const broadcastUpdateSplashImage = useCallback(async (url: string | null) => {
    // Optimistic
    _splashImageUrl = url
    notify()

    const { error } = await supabase.from('settings').upsert({
      key: 'splash_image',
      value: { url }
    })
    if (error) console.error("Error updating splash image:", error)
  }, [])

  return {
    campaigns,
    splashImageUrl,
    broadcastCreateCampaign,
    broadcastUpdateCampaign,
    broadcastDeleteCampaign,
    broadcastUpdateSplashImage,
    reorderCampaign,
    getActiveCampaignForItem,
    applyDiscount,
    loading,
  }
}
