"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { MenuItem } from "@/lib/menu-items"
import { ALL_MENU_ITEMS } from "@/lib/menu-items"
import { supabase } from "@/lib/supabase"

function mapRow(row: Record<string, unknown>): MenuItem {
  // Default customizations in case the DB column is null or missing
  const defaultCustomizations = {
    strength: true, sugar: true, shot: true, milk: true, size: true, syrup: true, chocolate: false, teaAroma: false
  }

  const rawCustomizations = row.customizations as Record<string, boolean> | null

  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    price: row.price as number,
    popular: (row.popular as boolean) ?? false,
    category: (row.category as "hot" | "iced") || "hot",
    imageUrl: (row.image_url as string) || undefined,
    sortOrder: (row.sort_order as number) ?? 0,
    customizations: rawCustomizations ? { ...defaultCustomizations, ...rawCustomizations } : defaultCustomizations,
  }
}

function sortByOrder(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

let cachedMenuItems: MenuItem[] | null = null

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(cachedMenuItems || ALL_MENU_ITEMS)
  const [loading, setLoading] = useState(!cachedMenuItems)
  // Prevent realtime from overwriting during reorder
  const reorderingRef = useRef(false)

  useEffect(() => {
    const fetchAndSeed = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true })

      if (error) {
        console.warn("menu_items table not ready:", error.message)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        const mapped = data.map(mapRow)
        cachedMenuItems = mapped
        setMenuItems(mapped)
      } else {
        // Seed from static data preserving original order
        const seed = ALL_MENU_ITEMS.map((item, index) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          popular: item.popular ?? false,
          category: item.category,
          image_url: null,
          sort_order: index,
          customizations: item.customizations || {
            strength: true, sugar: true, shot: true, milk: true, size: true, syrup: true, chocolate: false, teaAroma: false
          },
        }))
        const { error: seedErr } = await supabase
          .from("menu_items")
          .upsert(seed, { onConflict: "id" })
        if (seedErr) {
          console.warn("Could not seed menu_items:", seedErr.message)
        }
      }
      setLoading(false)
    }

    fetchAndSeed()

    const channelId = crypto.randomUUID()
    const channel = supabase
      .channel(`menu-items-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        (payload) => {
          // Skip realtime updates during reorder to prevent race conditions
          if (reorderingRef.current) return

          if (payload.eventType === "INSERT") {
            const item = mapRow(payload.new as Record<string, unknown>)
            setMenuItems((prev) => {
              if (prev.find((i) => i.id === item.id)) return prev
              const next = sortByOrder([...prev, item])
              cachedMenuItems = next
              return next
            })
          } else if (payload.eventType === "UPDATE") {
            const item = mapRow(payload.new as Record<string, unknown>)
            setMenuItems((prev) => {
              const next = sortByOrder(prev.map((i) => (i.id === item.id ? item : i)))
              cachedMenuItems = next
              return next
            })
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as Record<string, unknown>).id as string
            setMenuItems((prev) => {
              const next = prev.filter((i) => i.id !== deletedId)
              cachedMenuItems = next
              return next
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const createMenuItem = useCallback(
    async (item: Omit<MenuItem, "originalPrice" | "discountPercent">) => {
      const maxOrder = menuItems.reduce((max, i) => Math.max(max, i.sortOrder ?? 0), -1)
      const { error } = await supabase.from("menu_items").insert({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        popular: item.popular ?? false,
        category: item.category,
        image_url: item.imageUrl || null,
        sort_order: maxOrder + 1,
        customizations: item.customizations || {
          strength: true, sugar: true, shot: true, milk: true, size: true, syrup: true, chocolate: false, teaAroma: false
        },
      })
      if (error) throw error
    },
    [menuItems]
  )

  const updateMenuItem = useCallback(
    async (
      id: string,
      updates: Partial<Omit<MenuItem, "id" | "originalPrice" | "discountPercent">>
    ) => {
      // Build patch with only the provided fields — never send undefined
      const patch: Record<string, unknown> = {}
      if (updates.name !== undefined) patch.name = updates.name
      if (updates.description !== undefined) patch.description = updates.description
      if (updates.price !== undefined) patch.price = updates.price
      if (updates.popular !== undefined) patch.popular = updates.popular
      if (updates.category !== undefined) patch.category = updates.category
      if (updates.sortOrder !== undefined) patch.sort_order = updates.sortOrder
      if (updates.customizations !== undefined) patch.customizations = updates.customizations
      // Image: explicitly check "imageUrl" key presence, convert to null if empty
      if ("imageUrl" in updates) {
        patch.image_url = updates.imageUrl || null
      }

      if (Object.keys(patch).length === 0) return

      const { error } = await supabase.from("menu_items").update(patch).eq("id", id)
      if (error) throw error
    },
    []
  )

  /** Move an item one step up or down within its category */
  const reorderItem = useCallback(
    async (id: string, direction: "up" | "down") => {
      const item = menuItems.find((i) => i.id === id)
      if (!item) return

      const categoryItems = sortByOrder(menuItems.filter((i) => i.category === item.category))
      const idx = categoryItems.findIndex((i) => i.id === id)
      const targetIdx = direction === "up" ? idx - 1 : idx + 1

      if (targetIdx < 0 || targetIdx >= categoryItems.length) return

      const target = categoryItems[targetIdx]
      const myOrder = item.sortOrder ?? idx
      const targetOrder = target.sortOrder ?? targetIdx

      // If sort_order values are equal, assign distinct values first
      if (myOrder === targetOrder) {
        // Re-index all items in this category
        const updates = categoryItems.map((ci, i) => ({
          id: ci.id,
          sort_order: i,
        }))
        for (const u of updates) {
          await supabase.from("menu_items").update({ sort_order: u.sort_order }).eq("id", u.id)
        }
        // Refetch and retry
        const { data } = await supabase
          .from("menu_items")
          .select("*")
          .order("sort_order", { ascending: true })
        if (data) {
          const mapped = data.map(mapRow)
          cachedMenuItems = mapped
          setMenuItems(mapped)
        }
        return
      }

      // Block realtime from overwriting during swap
      reorderingRef.current = true

      // Optimistic local update first
      setMenuItems((prev) => {
        const next = sortByOrder(
          prev.map((i) => {
            if (i.id === item.id) return { ...i, sortOrder: targetOrder }
            if (i.id === target.id) return { ...i, sortOrder: myOrder }
            return i
          })
        )
        cachedMenuItems = next
        return next
      })

      // Persist to DB sequentially to avoid race conditions
      await supabase.from("menu_items").update({ sort_order: targetOrder }).eq("id", item.id)
      await supabase.from("menu_items").update({ sort_order: myOrder }).eq("id", target.id)

      // Re-enable realtime after a brief delay
      setTimeout(() => {
        reorderingRef.current = false
      }, 500)
    },
    [menuItems]
  )

  const deleteMenuItem = useCallback(async (id: string) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id)
    if (error) throw error
  }, [])

  return { menuItems, loading, createMenuItem, updateMenuItem, deleteMenuItem, reorderItem }
}
