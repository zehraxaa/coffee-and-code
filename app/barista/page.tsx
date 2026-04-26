"use client"

import { BaristaDashboard } from "@/components/barista-dashboard"
import { useBroadcastOrders } from "@/hooks/use-broadcast-orders"
import { useToast } from "@/hooks/use-toast"
import type { OrderStatus } from "@/lib/types"

export default function BaristaPage() {
  const { orders, broadcastUpdateStatus } = useBroadcastOrders()
  const { toast } = useToast()

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    broadcastUpdateStatus(orderId, status)
    toast({
      title: "Order Updated",
      description: `Status changed to ${status}`,
    })
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <main className="mx-auto max-w-2xl p-4">
        <BaristaDashboard orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
      </main>
    </div>
  )
}
