"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coffee, Clock, Package, CheckCircle } from "lucide-react"
import type { Order, OrderStatus } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface BaristaDashboardProps {
  orders: Order[]
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void
}

export function BaristaDashboard({ orders, onUpdateOrderStatus }: BaristaDashboardProps) {
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "received":
        return "bg-muted text-muted-foreground"
      case "preparing":
        return "bg-accent/20 text-accent-foreground border-accent"
      case "ready":
        return "bg-primary/20 text-primary border-primary"
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

  const receivedOrders = orders.filter((order) => order.status === "received")
  const preparingOrders = orders.filter((order) => order.status === "preparing")
  const readyOrders = orders.filter((order) => order.status === "ready")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-primary p-6 text-primary-foreground">
        <h1 className="text-3xl font-bold">Barista Dashboard</h1>
        <p className="mt-1 text-sm opacity-90">Manage incoming orders</p>
        <div className="mt-4 flex gap-4 text-sm">
          <div>
            <p className="opacity-80">Pending</p>
            <p className="text-2xl font-bold">{receivedOrders.length}</p>
          </div>
          <div>
            <p className="opacity-80">In Progress</p>
            <p className="text-2xl font-bold">{preparingOrders.length}</p>
          </div>
          <div>
            <p className="opacity-80">Ready</p>
            <p className="text-2xl font-bold">{readyOrders.length}</p>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12">
          <Coffee className="h-16 w-16 text-muted-foreground/50" />
          <p className="mt-4 text-center text-muted-foreground">No orders to display</p>
          <p className="text-center text-sm text-muted-foreground">New orders will appear here</p>
        </Card>
      ) : (
        <>
          {/* Received Orders */}
          {receivedOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">New Orders ({receivedOrders.length})</h2>
              {receivedOrders.map((order) => (
                <Card key={order.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Coffee className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">Order #{order.id.substring(0, 6)}</h3>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">Received</span>
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDistanceToNow(order.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coffee Strength:</span>
                      <span className="font-medium text-foreground">{order.coffeeStrength}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sugar Level:</span>
                      <span className="font-medium text-foreground">{order.sugarLevel}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shot:</span>
                      <span className="font-medium text-foreground capitalize">{order.shot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Milk:</span>
                      <span className="font-medium text-foreground capitalize">{order.milkType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cup:</span>
                      <span className="font-medium text-foreground capitalize">{order.cupType}</span>
                    </div>
                    {order.syrups.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Syrups:</span>
                        <span className="font-medium text-foreground">{order.syrups.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Select
                      value={order.status}
                      onValueChange={(value) => onUpdateOrderStatus(order.id, value as OrderStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Preparing Orders */}
          {preparingOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">In Progress ({preparingOrders.length})</h2>
              {preparingOrders.map((order) => (
                <Card key={order.id} className="border-accent p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                        <Package className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">Order #{order.id.substring(0, 6)}</h3>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">Preparing</span>
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDistanceToNow(order.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shot:</span>
                      <span className="font-medium text-foreground capitalize">{order.shot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Milk:</span>
                      <span className="font-medium text-foreground capitalize">{order.milkType}</span>
                    </div>
                    {order.syrups.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Syrups:</span>
                        <span className="font-medium text-foreground">{order.syrups.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Select
                      value={order.status}
                      onValueChange={(value) => onUpdateOrderStatus(order.id, value as OrderStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Ready Orders */}
          {readyOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Ready for Pickup ({readyOrders.length})</h2>
              {readyOrders.map((order) => (
                <Card key={order.id} className="border-2 border-primary p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">Order #{order.id.substring(0, 6)}</h3>
                          <Badge className="bg-primary text-primary-foreground">Ready!</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDistanceToNow(order.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cup Type:</span>
                      <span className="font-medium text-foreground capitalize">{order.cupType}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
