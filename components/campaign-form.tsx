"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Megaphone,
  Trash2,
  Plus,
  ImageIcon,
  X,
  Calendar,
  Percent,
  CheckSquare,
  Square,
  Clock,
  Tag,
} from "lucide-react"
import { ALL_MENU_ITEMS } from "@/lib/menu-items"
import type { Campaign } from "@/lib/types"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface CampaignFormProps {
  campaigns: Campaign[]
  onCreateCampaign: (campaign: Campaign) => void
  onDeleteCampaign: (campaignId: string) => void
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

export function CampaignForm({ campaigns, onCreateCampaign, onDeleteCampaign }: CampaignFormProps) {
  const [title, setTitle] = useState("")
  const [durationHours, setDurationHours] = useState("24")
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [discountPercent, setDiscountPercent] = useState("20")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showOnSplash, setShowOnSplash] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleItem = (id: string) => {
    if (id === "all") {
      setSelectedItemIds((prev) => (prev.includes("all") ? [] : ["all"]))
      return
    }
    setSelectedItemIds((prev) => {
      const withoutAll = prev.filter((x) => x !== "all")
      return withoutAll.includes(id)
        ? withoutAll.filter((x) => x !== id)
        : [...withoutAll, id]
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = "Campaign title is required."
    const hrs = parseFloat(durationHours)
    if (isNaN(hrs) || hrs <= 0) errs.duration = "Enter a valid duration (hours)."
    if (selectedItemIds.length === 0) errs.items = "Select at least one product."
    const pct = parseFloat(discountPercent)
    if (isNaN(pct) || pct <= 0 || pct > 100) errs.discount = "Enter a discount between 1 and 100."
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreate = () => {
    if (!validate()) return
    const expiresAt = new Date(Date.now() + parseFloat(durationHours) * 3600 * 1000).toISOString()
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: `${discountPercent}% off on selected items`,
      expiresAt,
      applicableItemIds: selectedItemIds,
      discountPercent: parseFloat(discountPercent),
      imageUrl: imagePreview ?? undefined,
      showOnSplash,
      createdAt: new Date().toISOString(),
    }
    onCreateCampaign(campaign)
    // Reset
    setTitle("")
    setDurationHours("24")
    setSelectedItemIds([])
    setDiscountPercent("20")
    setImagePreview(null)
    setShowOnSplash(false)
    setErrors({})
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const activeCampaigns = campaigns.filter((c) => new Date(c.expiresAt) > new Date())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Campaign</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create discount campaigns visible on the customer screen
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Megaphone className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Active campaigns list */}
      {activeCampaigns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Active Campaigns ({activeCampaigns.length})
          </h2>
          <div className="space-y-3">
            {activeCampaigns.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
              >
                {c.imageUrl && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <Image src={c.imageUrl} alt={c.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground truncate">{c.title}</p>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {c.discountPercent}% off
                    </Badge>
                    {c.showOnSplash && (
                      <Badge variant="outline" className="text-xs shrink-0 border-primary/40 text-primary">
                        On splash
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.applicableItemIds.includes("all")
                      ? "All items"
                      : c.applicableItemIds
                          .map((id) => ALL_MENU_ITEMS.find((m) => m.id === id)?.name ?? id)
                          .join(", ")}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeLeft(c.expiresAt)}</span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDeleteCampaign(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <Card className="p-6 space-y-6">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </h2>

        {/* Success */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300"
            >
              Campaign created and sent to customer screen!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Campaign Title <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="e.g. Summer Special"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })) }}
            className={errors.title ? "border-destructive" : ""}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Campaign Duration (hours) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            min="1"
            placeholder="24"
            value={durationHours}
            onChange={(e) => { setDurationHours(e.target.value); setErrors((p) => ({ ...p, duration: "" })) }}
            className={errors.duration ? "border-destructive" : ""}
          />
          {durationHours && !isNaN(parseFloat(durationHours)) && parseFloat(durationHours) > 0 && (
            <p className="text-xs text-muted-foreground">
              Expires: {new Date(Date.now() + parseFloat(durationHours) * 3600000).toLocaleString("tr-TR")}
            </p>
          )}
          {errors.duration && <p className="text-xs text-destructive">{errors.duration}</p>}
        </div>

        {/* Discount percent */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5" />
            Discount Percentage <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="100"
              placeholder="20"
              value={discountPercent}
              onChange={(e) => { setDiscountPercent(e.target.value); setErrors((p) => ({ ...p, discount: "" })) }}
              className={`w-32 ${errors.discount ? "border-destructive" : ""}`}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          {errors.discount && <p className="text-xs text-destructive">{errors.discount}</p>}
        </div>

        {/* Applicable items */}
        <div className="space-y-3">
          <Label className="flex items-center gap-1.5">
            Applicable Products <span className="text-destructive">*</span>
          </Label>
          {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}

          {/* All items toggle */}
          <button
            type="button"
            onClick={() => toggleItem("all")}
            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              selectedItemIds.includes("all")
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border text-foreground hover:bg-muted/50"
            }`}
          >
            {selectedItemIds.includes("all") ? (
              <CheckSquare className="h-4 w-4 shrink-0" />
            ) : (
              <Square className="h-4 w-4 shrink-0" />
            )}
            All Menu Items
          </button>

          {!selectedItemIds.includes("all") && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-2">Hot Drinks</p>
              {ALL_MENU_ITEMS.filter((m) => m.category === "hot").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    selectedItemIds.includes(item.id)
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-foreground hover:bg-muted/50"
                  }`}
                >
                  {selectedItemIds.includes(item.id) ? (
                    <CheckSquare className="h-4 w-4 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 shrink-0" />
                  )}
                  <span className="flex-1 text-left">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.price} TL</span>
                </button>
              ))}

              <p className="text-xs text-muted-foreground mt-3 mb-2">Iced Drinks</p>
              {ALL_MENU_ITEMS.filter((m) => m.category === "iced").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    selectedItemIds.includes(item.id)
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-foreground hover:bg-muted/50"
                  }`}
                >
                  {selectedItemIds.includes(item.id) ? (
                    <CheckSquare className="h-4 w-4 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 shrink-0" />
                  )}
                  <span className="flex-1 text-left">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.price} TL</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Campaign image */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            Campaign Image (optional)
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          {imagePreview ? (
            <div className="relative">
              <div className="relative h-40 w-full overflow-hidden rounded-xl border border-border">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-8 text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              <ImageIcon className="h-8 w-8 opacity-40" />
              <span>Click to upload image</span>
              <span className="text-xs opacity-60">PNG, JPG, WEBP</span>
            </button>
          )}
        </div>

        {/* Show on splash */}
        <button
          type="button"
          onClick={() => setShowOnSplash((v) => !v)}
          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
            showOnSplash
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border text-foreground hover:bg-muted/50"
          }`}
        >
          {showOnSplash ? (
            <CheckSquare className="h-4 w-4 shrink-0" />
          ) : (
            <Square className="h-4 w-4 shrink-0" />
          )}
          <div className="text-left">
            <p className="font-medium">Add image to splash screen</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Show this campaign image as a promo popup when customers open the app
            </p>
          </div>
        </button>

        {/* Submit */}
        <Button className="w-full" size="lg" onClick={handleCreate}>
          <Megaphone className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </Card>
    </div>
  )
}
