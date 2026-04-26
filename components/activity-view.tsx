"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coffee, Clock, CheckCircle, Package, XCircle } from "lucide-react"
import { motion } from "framer-motion"
import type { Order } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { formatOrderNumber } from "@/lib/order-number"

interface ActivityViewProps {
  orders: Order[]
  onRateOrder: (orderId: string) => void
}

export function ActivityView({ orders, onRateOrder }: ActivityViewProps) {
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "received":
        return "bg-muted text-muted-foreground"
      case "preparing":
        return "bg-accent/20 text-accent-foreground border-accent"
      case "ready":
        return "bg-primary/20 text-primary border-primary"
      case "cancelled":
        return "bg-destructive/20 text-destructive border-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "received":
        return <Clock className="h-4 w-4" />
      case "preparing":
        return <Package className="h-4 w-4" />
      case "ready":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
    }
  }

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "received":
        return "Received"
      case "preparing":
        return "Preparing"
      case "ready":
        return "Ready"
      case "cancelled":
        return "Cancelled"
      default:
        return status
    }
  }

  const activeOrders = orders.filter((order) => order.status !== "completed" && order.status !== "cancelled")
  const pastOrders = orders.filter((order) => order.status === "completed" || order.status === "cancelled")

  const renderOrderCard = (order: Order, index: number) => (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`overflow-hidden p-6 ${order.status === "ready" ? "border-2 border-primary" : ""}`}>
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                order.status === "ready" ? "bg-primary text-primary-foreground" : "bg-primary/10"
              }`}
            >
              {order.status === "ready" ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <Coffee className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {order.orderNumber ? formatOrderNumber(order.orderNumber) + " · " : ""}
                  {order.itemName || "Custom Order"}
                </h3>
                <Badge variant="outline" className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{getStatusText(order.status)}</span>
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDistanceToNow(order.timestamp, { addSuffix: true })}
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Shot:</span> {order.shot}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Strength:</span>{" "}
                  <span className="capitalize">{order.coffeeStrength}</span>
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Sugar:</span> {order.sugarLevel}/5
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Cup:</span> {order.cupType}
                </p>
                {order.milkType && !(["americano", "espresso", "iced americano"].some(n => (order.itemName || "").toLowerCase().includes(n))) && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Milk:</span> {order.milkType}
                  </p>
                )}
                {order.chocolateType && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Chocolate:</span> {order.chocolateType}
                  </p>
                )}
                {order.price && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Price:</span> {order.price}
                  </p>
                )}
                {order.syrups.length > 0 && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Syrups:</span> {order.syrups.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Progress Bar - only show for active orders */}
        {order.status !== "completed" && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    order.status === "received" || order.status === "preparing" || order.status === "ready"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Received</p>
              </div>
              <div className="h-0.5 flex-1 bg-muted">
                <div
                  className={`h-full transition-all ${
                    order.status === "preparing" || order.status === "ready" ? "w-full bg-primary" : "w-0"
                  }`}
                />
              </div>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    order.status === "preparing" || order.status === "ready"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Package className="h-4 w-4" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Preparing</p>
              </div>
              <div className="h-0.5 flex-1 bg-muted">
                <div className={`h-full transition-all ${order.status === "ready" ? "w-full bg-primary" : "w-0"}`} />
              </div>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    order.status === "ready" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Ready</p>
              </div>
            </div>
          </div>
        )}

        {order.status === "completed" && !order.rating && (
          <Button
            className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onRateOrder(order.id)}
          >
            Rate & Review
          </Button>
        )}

        {/* Yorum gösterimi */}
        {order.rating && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-foreground">
                {order.reviewerName || "Anonymous"}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`h-3.5 w-3.5 ${i < order.rating! ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            {order.review && <p className="text-xs text-muted-foreground">"{order.review}"</p>}
          </div>
        )}
      </Card>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Your Orders</h1>
        <p className="text-sm text-muted-foreground">Track your coffee journey</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="past">Past Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6 space-y-4">
          {activeOrders.length > 0 ? (
            activeOrders.map((order, index) => renderOrderCard(order, index))
          ) : (
            <Card className="flex flex-col items-center justify-center p-12">
              <Coffee className="h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-center text-muted-foreground">No active orders</p>
              <p className="text-center text-sm text-muted-foreground">Start by creating a custom order!</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-4">
          {pastOrders.length > 0 ? (
            pastOrders.map((order, index) => renderOrderCard(order, index))
          ) : (
            <Card className="flex flex-col items-center justify-center p-12">
              <Coffee className="h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-center text-muted-foreground">No order history</p>
              <p className="text-center text-sm text-muted-foreground">Your completed orders will appear here</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
