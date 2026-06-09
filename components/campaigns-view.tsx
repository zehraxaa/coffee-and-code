"use client"

import { ChevronLeft, Calendar, Clock, Percent, Tag } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Campaign } from "@/lib/types"

interface CampaignsViewProps {
  campaigns: Campaign[]
  onBack: () => void
}

function formatDateRange(c: Campaign): string {
  if (c.startDate && c.endDate) {
    const fmt = (d: string) => {
      const [y, m, day] = d.split("-")
      return `${day}/${m}/${y}`
    }
    const timeRange =
      c.startTime && c.endTime ? ` · ${c.startTime}–${c.endTime}` : ""
    return `${fmt(c.startDate)} → ${fmt(c.endDate)}${timeRange}`
  }
  return new Date(c.expiresAt).toLocaleDateString("tr-TR")
}

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return "Expired"
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h left`
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${mins}m left`
  return `${mins}m left`
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CampaignsView({ campaigns, onBack }: CampaignsViewProps) {
  // Filter: not expired + within date range
  const now = new Date()
  const activeCampaigns = campaigns.filter((c) => {
    if (new Date(c.expiresAt) <= now) return false
    if (c.startDate && c.endDate) {
      const todayStr = now.toISOString().split("T")[0]
      if (todayStr < c.startDate || todayStr > c.endDate) return false
    }
    return true
  })

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-0 py-3 mb-6 -mx-4 px-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">
            Current Campaigns
          </h1>
          <p className="text-xs text-muted-foreground">
            {activeCampaigns.length} active campaign{activeCampaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {activeCampaigns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 flex flex-col items-center justify-center gap-3 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Tag className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">No Active Campaigns</p>
          <p className="text-sm text-muted-foreground">
            Check back later for new deals and discounts!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4 pb-8">
          {activeCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id ?? index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.35 }}
            >
              {/* Campaign Card */}
              <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                {/* Image or gradient banner */}
                <div className="relative h-44 w-full">
                  {campaign.imageUrl ? (
                    <>
                      <Image
                        src={campaign.imageUrl}
                        alt={campaign.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
                  )}

                  {/* Discount badge */}
                  {campaign.discountPercent > 0 && (
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center gap-1 rounded-full bg-white/90 dark:bg-black/70 px-2.5 py-1 shadow-sm backdrop-blur-sm">
                        <Percent className="h-3 w-3 text-primary" />
                        <span className="text-xs font-bold text-primary">
                          {campaign.discountPercent}% OFF
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Title overlay on image */}
                  <div className="absolute bottom-4 left-0 right-0 p-4">
                    <h2 className="text-xl font-bold text-white drop-shadow-sm">
                      {campaign.title}
                    </h2>
                    {campaign.description && (
                      <p className="mt-0.5 text-sm text-white/85 line-clamp-3">
                        {campaign.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details row */}
                <div className="bg-card px-4 py-3 space-y-2">
                  {/* Date range */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatDateRange(campaign)}</span>
                  </div>

                  {/* Active days */}
                  {campaign.activeDays && campaign.activeDays.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DAY_LABELS.map((label, i) => {
                        const active = campaign.activeDays!.includes(i)
                        return (
                          <span
                            key={i}
                            className={`inline-flex h-6 w-9 items-center justify-center rounded-md text-[10px] font-semibold ${active
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground/40"
                              }`}
                          >
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Time left */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-medium">{formatTimeLeft(campaign.expiresAt)}</span>
                    </div>
                    {campaign.discountPercent === 0 && (
                      <Badge variant="outline" className="text-[10px] border-primary text-primary">
                        Promotion
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
