"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Campaign } from "@/lib/types"

type CampaignMessage =
  | { type: "CAMPAIGN_CREATED"; campaign: Campaign }
  | { type: "CAMPAIGN_UPDATED"; campaign: Campaign }
  | { type: "CAMPAIGN_DELETED"; campaignId: string }
  | { type: "CAMPAIGNS_SYNC_REQUEST" }
  | { type: "CAMPAIGNS_SYNC_RESPONSE"; campaigns: Campaign[] }
  | { type: "SPLASH_IMAGE_UPDATED"; url: string | null }

const CHANNEL_NAME = "coffee_and_code_campaigns"
const STORAGE_KEY = "cc_campaigns"
const SPLASH_STORAGE_KEY = "cc_splash_image"

function loadSplashImage(): string | null {
  if (typeof window === "undefined") return null
  try { return localStorage.getItem(SPLASH_STORAGE_KEY) } catch { return null }
}

function saveSplashImage(url: string | null) {
  if (typeof window === "undefined") return
  try {
    if (url) localStorage.setItem(SPLASH_STORAGE_KEY, url)
    else localStorage.removeItem(SPLASH_STORAGE_KEY)
  } catch { /* ignore */ }
}

function loadFromStorage(): Campaign[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: Campaign[] = JSON.parse(raw)
    // Süresi geçmiş kampanyaları filtrele
    const now = new Date()
    return parsed.filter((c) => new Date(c.expiresAt) > now)
  } catch {
    return []
  }
}

function saveToStorage(campaigns: Campaign[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns))
  } catch {
    // ignore
  }
}

export function useBroadcastCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [splashImageUrl, setSplashImageUrl] = useState<string | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const campaignsRef = useRef<Campaign[]>([])

  useEffect(() => {
    campaignsRef.current = campaigns
  }, [campaigns])

  useEffect(() => {
    if (typeof window === "undefined") return

    // localStorage'dan yükle
    const stored = loadFromStorage()
    if (stored.length > 0) {
      setCampaigns(stored)
      campaignsRef.current = stored
    }

    // Splash image yükle
    const storedSplash = loadSplashImage()
    if (storedSplash) setSplashImageUrl(storedSplash)

    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = (event: MessageEvent<CampaignMessage>) => {
      const msg = event.data
      switch (msg.type) {
        case "CAMPAIGN_CREATED":
          setCampaigns((prev) => {
            if (prev.find((c) => c.id === msg.campaign.id)) return prev
            const next = [msg.campaign, ...prev]
            saveToStorage(next)
            return next
          })
          break
        case "CAMPAIGN_UPDATED":
          setCampaigns((prev) => {
            const next = prev.map((c) => (c.id === msg.campaign.id ? msg.campaign : c))
            saveToStorage(next)
            return next
          })
          break
        case "CAMPAIGN_DELETED":
          setCampaigns((prev) => {
            const next = prev.filter((c) => c.id !== msg.campaignId)
            saveToStorage(next)
            return next
          })
          break
        case "CAMPAIGNS_SYNC_REQUEST":
          channel.postMessage({
            type: "CAMPAIGNS_SYNC_RESPONSE",
            campaigns: campaignsRef.current,
          } as CampaignMessage)
          break
        case "CAMPAIGNS_SYNC_RESPONSE":
          setCampaigns((prev) => {
            if (prev.length > 0) return prev
            saveToStorage(msg.campaigns)
            return msg.campaigns
          })
          break
        case "SPLASH_IMAGE_UPDATED":
          setSplashImageUrl(msg.url)
          saveSplashImage(msg.url)
          break
      }
    }

    channel.postMessage({ type: "CAMPAIGNS_SYNC_REQUEST" } as CampaignMessage)

    return () => {
      channel.close()
    }
  }, [])

  const broadcastCreateCampaign = useCallback((campaign: Campaign) => {
    setCampaigns((prev) => {
      if (prev.find((c) => c.id === campaign.id)) return prev
      const next = [campaign, ...prev]
      saveToStorage(next)
      return next
    })
    channelRef.current?.postMessage({
      type: "CAMPAIGN_CREATED",
      campaign,
    } as CampaignMessage)
  }, [])

  const broadcastUpdateCampaign = useCallback((campaign: Campaign) => {
    setCampaigns((prev) => {
      const next = prev.map((c) => (c.id === campaign.id ? campaign : c))
      saveToStorage(next)
      return next
    })
    channelRef.current?.postMessage({
      type: "CAMPAIGN_UPDATED",
      campaign,
    } as CampaignMessage)
  }, [])

  const broadcastDeleteCampaign = useCallback((campaignId: string) => {
    setCampaigns((prev) => {
      const next = prev.filter((c) => c.id !== campaignId)
      saveToStorage(next)
      return next
    })
    channelRef.current?.postMessage({
      type: "CAMPAIGN_DELETED",
      campaignId,
    } as CampaignMessage)
  }, [])

  const broadcastUpdateSplashImage = useCallback((url: string | null) => {
    setSplashImageUrl(url)
    saveSplashImage(url)
    channelRef.current?.postMessage({
      type: "SPLASH_IMAGE_UPDATED",
      url,
    } as CampaignMessage)
  }, [])

  /** Verilen item ID'sine uygulanan aktif kampanyayı döner (zaman aralığı kontrolü dahil) */
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

        // Tarih + saat aralığı kontrolü
        if (c.startDate && c.endDate) {
          const todayStr = now.toISOString().split("T")[0] // "YYYY-MM-DD"
          if (todayStr < c.startDate || todayStr > c.endDate) return false

          // Saat aralığı
          if (c.startTime && c.endTime) {
            const currentMinutes = now.getHours() * 60 + now.getMinutes()
            const [sh, sm] = c.startTime.split(":").map(Number)
            const [eh, em] = c.endTime.split(":").map(Number)
            const startMinutes = sh * 60 + sm
            const endMinutes = eh * 60 + em
            if (currentMinutes < startMinutes || currentMinutes > endMinutes) return false
          }
        }

        return true
      })
    },
    [campaigns]
  )

  /** Verilen base fiyatına kampanya indirimini uygular */
  const applyDiscount = useCallback(
    (basePriceTL: number, itemId: string): { finalPrice: number; discount: number; campaign?: Campaign } => {
      const campaign = getActiveCampaignForItem(itemId)
      if (!campaign) return { finalPrice: basePriceTL, discount: 0 }
      const discount = Math.round(basePriceTL * (campaign.discountPercent / 100))
      return { finalPrice: basePriceTL - discount, discount, campaign }
    },
    [getActiveCampaignForItem]
  )

  return {
    campaigns,
    splashImageUrl,
    broadcastCreateCampaign,
    broadcastUpdateCampaign,
    broadcastDeleteCampaign,
    broadcastUpdateSplashImage,
    getActiveCampaignForItem,
    applyDiscount,
  }
}
