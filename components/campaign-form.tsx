"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  Sparkles,
  UploadCloud,
  AlignLeft,
} from "lucide-react"
import { useMenuItems } from "@/hooks/use-menu-items"
import type { Campaign } from "@/lib/types"
import { DateInput } from "@/components/ui/date-input"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface CampaignFormProps {
  campaigns: Campaign[]
  onCreateCampaign: (campaign: Campaign) => void
  onUpdateCampaign?: (campaign: Campaign) => void
  onDeleteCampaign: (campaignId: string) => void
  /** URL of the promo popup image (the X-closeable banner shown after splash) */
  splashImageUrl?: string | null
  onUpdateSplashImage?: (url: string | null) => void
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
  return new Date(c.expiresAt).toLocaleString("tr-TR")
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

export function CampaignForm({
  campaigns,
  onCreateCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  splashImageUrl,
  onUpdateSplashImage,
}: CampaignFormProps) {
  const { menuItems } = useMenuItems()
  // Campaign form state
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("22:00")
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [discountPercent, setDiscountPercent] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Promo popup image state
  const [promoPreview, setPromoPreview] = useState<string | null>(splashImageUrl ?? null)
  const [promoSuccess, setPromoSuccess] = useState(false)
  const promoFileRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split("T")[0]

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
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handlePromoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPromoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSavePromo = () => {
    if (onUpdateSplashImage) {
      onUpdateSplashImage(promoPreview)
      setPromoSuccess(true)
      setTimeout(() => setPromoSuccess(false), 3000)
    }
  }

  const handleRemovePromo = () => {
    setPromoPreview(null)
    if (promoFileRef.current) promoFileRef.current.value = ""
    if (onUpdateSplashImage) onUpdateSplashImage(null)
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = "Campaign title is required."
    if (!startDate) errs.startDate = "Please select a start date."
    if (!endDate) errs.endDate = "Please select an end date."
    if (startDate && endDate && endDate < startDate)
      errs.endDate = "End date must be after start date."
    if (selectedItemIds.length === 0) errs.items = "Select at least one product."
    if (discountPercent.trim() !== "") {
      const pct = parseFloat(discountPercent)
      if (isNaN(pct) || pct < 0 || pct > 100) {
        errs.discount = "Enter a discount between 0 and 100."
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreate = () => {
    if (!validate()) return
    const expiresAt = new Date(`${endDate}T${endTime || "23:59"}`).toISOString()
    const campaign: Campaign = {
      id: editingId || crypto.randomUUID(),
      title: title.trim(),
      description: details.trim(),
      expiresAt,
      startDate,
      endDate,
      startTime,
      endTime,
      applicableItemIds: selectedItemIds,
      discountPercent: discountPercent.trim() === "" ? 0 : parseFloat(discountPercent),
      imageUrl: imagePreview ?? undefined,
      createdAt: editingId ? (campaigns.find(c => c.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    }

    if (editingId && onUpdateCampaign) {
      onUpdateCampaign(campaign)
    } else {
      onCreateCampaign(campaign)
    }

    resetForm()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const resetForm = () => {
    setTitle("")
    setDetails("")
    setStartDate("")
    setEndDate("")
    setStartTime("08:00")
    setEndTime("22:00")
    setSelectedItemIds([])
    setDiscountPercent("")
    setImagePreview(null)
    setErrors({})
    setEditingId(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleEdit = (c: Campaign) => {
    setEditingId(c.id)
    setTitle(c.title)
    setDetails(c.description)
    setStartDate(c.startDate || "")
    setEndDate(c.endDate || "")
    setStartTime(c.startTime || "08:00")
    setEndTime(c.endTime || "22:00")
    setSelectedItemIds(c.applicableItemIds)
    setDiscountPercent(c.discountPercent === 0 ? "" : c.discountPercent.toString())
    setImagePreview(c.imageUrl || null)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeCampaigns = campaigns.filter((c) => new Date(c.expiresAt) > new Date())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{editingId ? "Edit Campaign" : "Create Campaign"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {editingId ? "Update existing campaign details" : "Create discount campaigns visible on the customer screen"}
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
                    {c.discountPercent > 0 ? (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {c.discountPercent}% off
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs shrink-0 border-primary text-primary">
                        Promotion
                      </Badge>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground italic">{c.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {c.applicableItemIds.includes("all")
                      ? "All items"
                      : c.applicableItemIds
                          .map((id) => menuItems.find((m) => m.id === id)?.name ?? id)
                          .join(", ")}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDateRange(c)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeLeft(c.expiresAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => handleEdit(c)}
                  >
                    <CheckSquare className="h-4 w-4" /> {/* Use CheckSquare or Edit if available */}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDeleteCampaign(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Form */}
      <Card className="p-6 space-y-6">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </h2>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300"
            >
              ✅ Campaign created and sent to customer screen!
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
            onChange={(e) => {
              setTitle(e.target.value)
              setErrors((p) => ({ ...p, title: "" }))
            }}
            className={errors.title ? "border-destructive" : ""}
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>

        {/* Campaign Details */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <AlignLeft className="h-3.5 w-3.5" />
            Campaign Details
          </Label>
          <Textarea
            placeholder="Describe the campaign details shown to customers (e.g. 'Every latte is 20% off this weekend!')"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Campaign Period <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Start Date (dd/mm/yyyy)</p>
              <DateInput
                value={startDate}
                onValueChange={(val) => {
                  setStartDate(val)
                  setErrors((p) => ({ ...p, startDate: "" }))
                }}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pr-10 ${errors.startDate ? "border-destructive" : ""}`}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">End Date (dd/mm/yyyy)</p>
              <DateInput
                value={endDate}
                onValueChange={(val) => {
                  setEndDate(val)
                  setErrors((p) => ({ ...p, endDate: "" }))
                }}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pr-10 ${errors.endDate ? "border-destructive" : ""}`}
              />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Discount Start Time
              </p>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Discount End Time
              </p>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Period preview */}
          {startDate && endDate && (
            <div className="rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Period: </span>
              {startDate.split("-").reverse().join("/")} {startTime}
              {" → "}
              {endDate.split("-").reverse().join("/")} {endTime}
              <span className="block mt-0.5 text-[10px] opacity-70">
                Campaign is visible to customers throughout this period; discounts apply only during the selected hours each day.
              </span>
            </div>
          )}
        </div>

        {/* Discount percent */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5" />
            Discount Percentage <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={discountPercent}
              onChange={(e) => {
                setDiscountPercent(e.target.value)
                setErrors((p) => ({ ...p, discount: "" }))
              }}
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
              {menuItems.filter((m) => m.category === "hot").map((item) => (
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
              {menuItems.filter((m) => m.category === "iced").map((item) => (
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
                onClick={() => {
                  setImagePreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
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

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button className="flex-1" size="lg" onClick={handleCreate}>
            <Megaphone className="mr-2 h-4 w-4" />
            {editingId ? "Update Campaign" : "Create Campaign"}
          </Button>
          {editingId && (
            <Button variant="outline" size="lg" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            {editingId ? "Campaign updated successfully!" : "Campaign launched successfully!"}
          </p>
        )}
      </Card>

      {/* ── Promo Popup / Opening Banner ── */}
      <Card className="p-6 space-y-5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Promo Popup Banner</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              The promotional image customers see after the app loads
            </p>
          </div>
        </div>

        <AnimatePresence>
          {promoSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300"
            >
              ✅ Promo banner updated! Customers will see the new image on their next visit.
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={promoFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePromoImageChange}
        />

        {promoPreview ? (
          <div className="space-y-3">
            {/* Simulate the popup appearance */}
            <div className="relative w-full max-w-xs mx-auto">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border shadow-lg">
                <Image src={promoPreview} alt="Promo popup preview" fill className="object-cover" />
              </div>
              {/* Fake X button for preview */}
              <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/70 border border-border">
                <X className="h-4 w-4 text-foreground/60" />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">Preview (as seen by customers)</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => promoFileRef.current?.click()}
              >
                <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                Change Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/40 hover:bg-destructive/10"
                onClick={handleRemovePromo}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button className="w-full" onClick={handleSavePromo}>
              <Sparkles className="mr-2 h-4 w-4" />
              Save Promo Banner
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => promoFileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 py-10 text-sm text-muted-foreground hover:bg-primary/10 transition-colors"
          >
            <UploadCloud className="h-10 w-10 text-primary/40" />
            <span className="font-medium text-foreground/70">Upload promo popup image</span>
            <span className="text-xs opacity-60">
              Replaces the current popup banner · PNG, JPG, WEBP
            </span>
          </button>
        )}
      </Card>
    </div>
  )
}
