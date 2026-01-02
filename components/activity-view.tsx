"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coffee, Clock, CheckCircle, Package } from "lucide-react"
import { motion } from "framer-motion"
import type { Order } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

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
    }
  }

  const activeOrders = orders.filter((order) => order.status !== "completed")
  const pastOrders = orders.filter((order) => order.status === "completed")

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
                <h3 className="font-semibold text-foreground">Custom Order</h3>
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
                  <span className="font-medium text-foreground">Milk:</span> {order.milkType}
                </p>
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

        {order.status === "ready" && !order.rating && (
          <Button
            className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onRateOrder(order.id)}
          >
            Rate & Review
          </Button>
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
