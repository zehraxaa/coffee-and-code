"use client"

import { useState } from "react"
import { Coffee, ChevronDown, ChevronUp, ArrowRight, CheckCircle2, XCircle, Clock, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Order, OrderStatus } from "@/lib/types"
import { formatOrderNumber } from "@/lib/order-number"
import { formatDistanceToNow } from "date-fns"

interface BaristaDashboardProps {
  orders: Order[]
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void
}

const NO_MILK_IDS = ["americano", "espresso"]

function isNoMilk(name?: string) {
  return NO_MILK_IDS.some((n) => (name || "").toLowerCase().includes(n))
}

interface OrderCardProps {
  order: Order
  column: "received" | "preparing" | "ready"
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (id: string, status: OrderStatus) => void
}

function OrderCard({ order, column, isExpanded, onToggle, onUpdate }: OrderCardProps) {
  const borderColor =
    column === "received"
      ? "border-amber-500/40"
      : column === "preparing"
      ? "border-blue-500/40"
      : "border-green-500/40"

  const accentText =
    column === "received"
      ? "text-amber-500"
      : column === "preparing"
      ? "text-blue-500"
      : "text-green-500"

  const expandedBg =
    column === "received"
      ? "bg-amber-500/5"
      : column === "preparing"
      ? "bg-blue-500/5"
      : "bg-green-500/5"

  return (
    <div className={`rounded-xl border ${borderColor} bg-card overflow-hidden`}>
      {/* Compact header */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors text-left gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-mono font-bold text-xs shrink-0 ${accentText}`}>
            {formatOrderNumber(order.orderNumber)}
          </span>
          <span className="text-sm font-medium text-foreground truncate">
            {order.itemName || "Custom Coffee"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(order.timestamp, { addSuffix: true })}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className={`px-3 pb-3 pt-2 border-t ${borderColor} ${expandedBg} space-y-3`}>
          <div className="space-y-1 text-xs">
            <Row label="Strength" value={<span className="capitalize">{order.coffeeStrength}</span>} />
            <Row label="Sugar" value={`${order.sugarLevel}/5`} />
            <Row label="Shot" value={<span className="capitalize">{order.shot}</span>} />
            <Row label="Cup" value={<span className="capitalize">{order.cupType}</span>} />
            {!isNoMilk(order.itemName) && (
              <Row label="Milk" value={<span className="capitalize">{order.milkType}</span>} />
            )}
            {order.chocolateType && (
              <Row label="Chocolate" value={<span className="capitalize">{order.chocolateType}</span>} />
            )}
            {order.syrups && order.syrups.length > 0 && (
              <Row label="Syrups" value={order.syrups.join(", ")} />
            )}
            {order.price && <Row label="Price" value={order.price} />}
          </div>

          {/* Action buttons */}
          {column === "received" && (
            <Button size="sm" className="w-full h-8 text-xs" onClick={() => onUpdate(order.id, "preparing")}>
              <ArrowRight className="mr-1 h-3 w-3" /> Start Preparing
            </Button>
          )}
          {column === "preparing" && (
            <Button size="sm" className="w-full h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white" onClick={() => onUpdate(order.id, "ready")}>
              <ArrowRight className="mr-1 h-3 w-3" /> Mark Ready
            </Button>
          )}
          {column === "ready" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-green-500 hover:bg-green-600 text-white"
                onClick={() => onUpdate(order.id, "completed")}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Picked Up
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => onUpdate(order.id, "cancelled")}
              >
                <XCircle className="mr-1 h-3 w-3" /> Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

export function BaristaDashboard({ orders, onUpdateOrderStatus }: BaristaDashboardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  const active = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled")
  const received = active.filter((o) => o.status === "received")
  const preparing = active.filter((o) => o.status === "preparing")
  const ready = active.filter((o) => o.status === "ready")

  const totalToday = orders.length

  const colHeader = (
    label: string,
    count: number,
    Icon: React.ElementType,
    color: string,
    bg: string
  ) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg} mb-2`}>
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className={`text-xs font-semibold ${color}`}>{label}</span>
      <span className={`ml-auto flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${color.replace("text-", "bg-")}`}>
        {count}
      </span>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Barista Dashboard</h1>
            <p className="text-sm opacity-80 mt-0.5">Manage incoming orders</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
            <Coffee className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
          {[
            { label: "Today", value: totalToday },
            { label: "Received", value: received.length },
            { label: "Preparing", value: preparing.length },
            { label: "Ready", value: ready.length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-primary-foreground/10 py-2">
              <p className="text-lg font-bold">{value}</p>
              <p className="text-[10px] opacity-70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3-column kanban */}
      <div className="grid grid-cols-3 gap-3 items-start">
        {/* Received */}
        <div>
          {colHeader("Received", received.length, Clock, "text-amber-500", "bg-amber-500/10")}
          <div className="space-y-2">
            {received.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">No orders</p>
            )}
            {received.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                column="received"
                isExpanded={expandedId === o.id}
                onToggle={() => toggle(o.id)}
                onUpdate={onUpdateOrderStatus}
              />
            ))}
          </div>
        </div>

        {/* Preparing */}
        <div>
          {colHeader("Preparing", preparing.length, Package, "text-blue-500", "bg-blue-500/10")}
          <div className="space-y-2">
            {preparing.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">No orders</p>
            )}
            {preparing.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                column="preparing"
                isExpanded={expandedId === o.id}
                onToggle={() => toggle(o.id)}
                onUpdate={onUpdateOrderStatus}
              />
            ))}
          </div>
        </div>

        {/* Ready */}
        <div>
          {colHeader("Ready", ready.length, CheckCircle2, "text-green-500", "bg-green-500/10")}
          <div className="space-y-2">
            {ready.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">No orders</p>
            )}
            {ready.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                column="ready"
                isExpanded={expandedId === o.id}
                onToggle={() => toggle(o.id)}
                onUpdate={onUpdateOrderStatus}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
