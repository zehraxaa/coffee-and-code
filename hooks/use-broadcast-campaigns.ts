"use client"

import { useState, useEffect, useCallback } from "react"
import type { Campaign } from "@/lib/types"
import { supabase } from "@/lib/supabase"

export function useBroadcastCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [splashImageUrl, setSplashImageUrl] = useState<string | null>(null)

  useEffect(() => {
    // 1. Fetch campaigns
    const fetchCampaigns = async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
      
      if (!error && data) {
        const now = new Date()
        const mappedCampaigns: Campaign[] = data.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description || "",
          expiresAt: c.expires_at,
          startDate: c.start_date || undefined,
          endDate: c.end_date || undefined,
          startTime: c.start_time || undefined,
          endTime: c.end_time || undefined,
          applicableItemIds: c.applicable_item_ids || [],
          discountPercent: c.discount_percent,
          imageUrl: c.image_url || undefined,
          createdAt: c.created_at,
        }))
        // Filter out expired campaigns
        setCampaigns(mappedCampaigns.filter(c => new Date(c.expiresAt) > now))
      }
    }

    // 2. Fetch splash image from settings
    const fetchSplash = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'splash_image')
        .single()
      
      if (!error && data && data.value?.url) {
        setSplashImageUrl(data.value.url)
      }
    }

    fetchCampaigns()
    fetchSplash()

    // 3. Listen to realtime changes for campaigns and splash image
    const channelId = crypto.randomUUID()
    const channel = supabase.channel(`campaigns-db-changes-${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const c = payload.new
          const newCamp: Campaign = {
            id: c.id,
            title: c.title,
            description: c.description || "",
            expiresAt: c.expires_at,
            startDate: c.start_date || undefined,
            endDate: c.end_date || undefined,
            startTime: c.start_time || undefined,
            endTime: c.end_time || undefined,
            applicableItemIds: c.applicable_item_ids || [],
            discountPercent: c.discount_percent,
            imageUrl: c.image_url || undefined,
            createdAt: c.created_at,
          }
          setCampaigns(prev => {
            if (prev.find(item => item.id === newCamp.id)) return prev
            return [newCamp, ...prev]
          })
        } else if (payload.eventType === 'UPDATE') {
          const c = payload.new
          setCampaigns(prev => prev.map(item => {
            if (item.id === c.id) {
              return {
                id: c.id,
                title: c.title,
                description: c.description || "",
                expiresAt: c.expires_at,
                startDate: c.start_date || undefined,
                endDate: c.end_date || undefined,
                startTime: c.start_time || undefined,
                endTime: c.end_time || undefined,
                applicableItemIds: c.applicable_item_ids || [],
                discountPercent: c.discount_percent,
                imageUrl: c.image_url || undefined,
                createdAt: c.created_at,
              }
            }
            return item
          }))
        } else if (payload.eventType === 'DELETE') {
          setCampaigns(prev => prev.filter(item => item.id !== payload.old.id))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: "key=eq.splash_image" }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new && payload.new.value && payload.new.value.url) {
            setSplashImageUrl(payload.new.value.url)
          } else {
            setSplashImageUrl(null)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const broadcastCreateCampaign = useCallback(async (campaign: Campaign) => {
    // Optimistic UI update
    setCampaigns(prev => {
      if (prev.find(c => c.id === campaign.id)) return prev
      return [campaign, ...prev]
    })

    const { error } = await supabase.from('campaigns').insert({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      expires_at: campaign.expiresAt,
      start_date: campaign.startDate || null,
      end_date: campaign.endDate || null,
      start_time: campaign.startTime || null,
      end_time: campaign.endTime || null,
      applicable_item_ids: campaign.applicableItemIds,
      discount_percent: campaign.discountPercent,
      image_url: campaign.imageUrl || null,
    })
    if (error) console.error("Error creating campaign:", error)
  }, [])

  const broadcastUpdateCampaign = useCallback(async (campaign: Campaign) => {
    // Optimistic UI update
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? campaign : c))

    const { error } = await supabase.from('campaigns').update({
      title: campaign.title,
      description: campaign.description,
      expires_at: campaign.expiresAt,
      start_date: campaign.startDate || null,
      end_date: campaign.endDate || null,
      start_time: campaign.startTime || null,
      end_time: campaign.endTime || null,
      applicable_item_ids: campaign.applicableItemIds,
      discount_percent: campaign.discountPercent,
      image_url: campaign.imageUrl || null,
    }).eq('id', campaign.id)
    if (error) console.error("Error updating campaign:", error)
  }, [])

  const broadcastDeleteCampaign = useCallback(async (campaignId: string) => {
    // Optimistic UI update
    setCampaigns(prev => prev.filter(c => c.id !== campaignId))

    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId)
    if (error) console.error("Error deleting campaign:", error)
  }, [])

  const broadcastUpdateSplashImage = useCallback(async (url: string | null) => {
    // Optimistic UI update
    setSplashImageUrl(url)

    const { error } = await supabase.from('settings').upsert({
      key: 'splash_image',
      value: { url }
    })
    if (error) console.error("Error updating splash image:", error)
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
