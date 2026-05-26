"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Coffee,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  UtensilsCrossed,
  ChevronUp,
  ChevronDown,
  ImageIcon,
} from "lucide-react"
import { useMenuItems } from "@/hooks/use-menu-items"
import type { MenuItem } from "@/lib/menu-items"
import { STANDARD_SYRUPS } from "@/lib/menu-items"
import { getCoffeeImage } from "@/lib/coffee-images"

interface ItemForm {
  id: string
  name: string
  description: string
  price: string
  popular: boolean
  category: "hot" | "iced"
  imageUrl: string
  customizations: {
    strength: boolean
    sugar: boolean
    shot: boolean
    milk: boolean
    size: boolean
    syrup: boolean
    syrupOptions?: string[]
    chocolate: boolean
    teaAroma: boolean
  }
}

const DEFAULT_FORM: ItemForm = {
  id: "",
  name: "",
  description: "",
  price: "100",
  popular: false,
  category: "hot",
  imageUrl: "",
  customizations: {
    strength: true, sugar: true, shot: true, milk: true, size: true, syrup: true, syrupOptions: STANDARD_SYRUPS, chocolate: false, teaAroma: false
  }
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export function MenuItemsManager() {
  const { menuItems, loading, createMenuItem, updateMenuItem, deleteMenuItem, reorderItem } =
    useMenuItems()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ItemForm>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const hotItems = menuItems.filter((i) => i.category === "hot")
  const icedItems = menuItems.filter((i) => i.category === "iced")

  function openAdd() {
    setForm(DEFAULT_FORM)
    setEditingId(null)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(item: MenuItem) {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description,
      price: String(item.price),
      popular: item.popular ?? false,
      category: item.category,
      imageUrl: item.imageUrl ?? "",
      customizations: item.customizations || DEFAULT_FORM.customizations,
    })
    setEditingId(item.id)
    setFormError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setFormError(null)
    setForm(DEFAULT_FORM)
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, imageUrl: ev.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError("Name is required."); return }
    if (!form.description.trim()) { setFormError("Description is required."); return }
    const priceNum = parseInt(form.price, 10)
    if (isNaN(priceNum) || priceNum <= 0) { setFormError("Price must be a positive number."); return }

    setSaving(true)
    setFormError(null)
    try {
      if (editingId) {
        await updateMenuItem(editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
          price: priceNum,
          popular: form.popular,
          category: form.category,
          imageUrl: form.imageUrl || undefined,
          customizations: form.customizations,
        })
      } else {
        await createMenuItem({
          id: slugify(form.name),
          name: form.name.trim(),
          description: form.description.trim(),
          price: priceNum,
          popular: form.popular,
          category: form.category,
          imageUrl: form.imageUrl || undefined,
          customizations: form.customizations,
        })
      }
      closeForm()
    } catch (err: any) {
      setFormError(err.message || "Failed to save item.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteMenuItem(id)
    } catch (err) {
      console.error("Delete error:", err)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    setReorderingId(id)
    try {
      await reorderItem(id, direction)
    } finally {
      setReorderingId(null)
    }
  }

  function renderCard(item: MenuItem, idx: number, list: MenuItem[]) {
    const img = item.imageUrl || getCoffeeImage(item.name)
    const isDeleting = deletingId === item.id
    const isReordering = reorderingId === item.id
    const isFirst = idx === 0
    const isLast = idx === list.length - 1

    return (
      <div
        key={item.id}
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
      >
        {/* Up/Down reorder */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={() => handleReorder(item.id, "up")}
            disabled={isFirst || isReordering}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleReorder(item.id, "down")}
            disabled={isLast || isReordering}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Thumbnail */}
        <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden border-2 border-primary/20">
          {img ? (
            <Image src={img} alt={item.name} width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10">
              <Coffee className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-foreground text-sm">{item.name}</p>
            {item.popular && (
              <Badge variant="secondary" className="text-[10px] h-4">Popular</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
          <p className="text-xs font-bold text-primary mt-0.5">{item.price} TL</p>
        </div>

        {/* Edit / Delete */}
        <div className="flex gap-1.5 shrink-0">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-destructive/40 text-destructive hover:bg-destructive hover:text-white"
            onClick={() => handleDelete(item.id)}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Menu Items</h1>
            <p className="text-sm text-muted-foreground">
              {menuItems.length} items · use ↑↓ to reorder
            </p>
          </div>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="hot">
          <TabsList className="w-fit">
            <TabsTrigger value="hot" className="text-sm px-5">
              ☕ Hot <span className="ml-1 text-xs opacity-60">({hotItems.length})</span>
            </TabsTrigger>
            <TabsTrigger value="iced" className="text-sm px-5">
              🧊 Iced <span className="ml-1 text-xs opacity-60">({icedItems.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hot" className="mt-4 space-y-2">
            {hotItems.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Coffee className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No hot drinks yet. Add one!</p>
              </div>
            ) : (
              hotItems.map((item, idx) => renderCard(item, idx, hotItems))
            )}
          </TabsContent>

          <TabsContent value="iced" className="mt-4 space-y-2">
            {icedItems.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Coffee className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No iced drinks yet. Add one!</p>
              </div>
            ) : (
              icedItems.map((item, idx) => renderCard(item, idx, icedItems))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[92vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
              <h2 className="text-xl font-bold text-foreground">
                {editingId ? "Edit Item" : "Add New Item"}
              </h2>
              <button
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Oat Milk Latte"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="e.g. Smooth espresso with creamy oat milk"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Price (TL) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="100"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Category <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["hot", "iced"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        form.category === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {cat === "hot" ? "☕ Hot" : "🧊 Iced"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image upload */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Cover Image{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="hidden"
                />
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {form.imageUrl ? (
                    <div className="relative w-full h-36">
                      <Image
                        src={form.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-28 gap-2 text-muted-foreground">
                      <ImageIcon className="h-7 w-7 opacity-50" />
                      <p className="text-sm">Click to upload photo</p>
                      <p className="text-xs opacity-60">JPG, PNG, WebP</p>
                    </div>
                  )}
                </div>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Popular */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.popular}
                  onChange={(e) => setForm((f) => ({ ...f, popular: e.target.checked }))}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm font-medium text-foreground">Mark as Popular ⭐</span>
              </label>

              {/* Customizations */}
              <div className="space-y-3 pt-2">
                <label className="text-sm font-medium text-foreground">
                  Available Customizations
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(DEFAULT_FORM.customizations).filter(k => k !== 'syrupOptions') as Array<keyof Omit<ItemForm['customizations'], 'syrupOptions'>>).map((key) => {
                    const labels: Record<string, string> = {
                      strength: "Strength / Brew",
                      sugar: "Sugar Level",
                      shot: "Espresso Shot",
                      milk: "Milk Type",
                      size: "Cup Size",
                      syrup: "Add Syrups",
                      chocolate: "Chocolate",
                      teaAroma: "Tea Aroma",
                    }
                    return (
                      <label key={key} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={form.customizations[key]}
                          onChange={(e) => setForm((f) => ({
                            ...f,
                            customizations: { ...f.customizations, [key]: e.target.checked }
                          }))}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        <span className="text-xs font-medium text-foreground">{labels[key]}</span>
                      </label>
                    )
                  })}
                </div>
                {/* Specific Syrup Selection */}
                {form.customizations.syrup && (
                  <div className="mt-3 p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Select available syrups:</p>
                    <div className="flex flex-wrap gap-2">
                      {STANDARD_SYRUPS.map((syrup) => {
                        const isSelected = form.customizations.syrupOptions?.includes(syrup) ?? true
                        return (
                          <Badge
                            key={syrup}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer px-3 py-1 text-[10px]"
                            onClick={() => {
                              setForm(f => {
                                const current = f.customizations.syrupOptions ?? STANDARD_SYRUPS
                                const next = isSelected 
                                  ? current.filter(s => s !== syrup)
                                  : [...current, syrup]
                                return {
                                  ...f,
                                  customizations: { ...f.customizations, syrupOptions: next }
                                }
                              })
                            }}
                          >
                            {syrup}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {formError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6 pt-2 shrink-0">
              <Button variant="outline" className="flex-1" onClick={closeForm}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editingId ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
