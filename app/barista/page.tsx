"use client"

import Image from "next/image"
import { useState } from "react"
import { BaristaDashboard } from "@/components/barista-dashboard"
import { useBroadcastOrders } from "@/hooks/use-broadcast-orders"
import { useToast } from "@/hooks/use-toast"
import type { OrderStatus } from "@/lib/types"
import {
  Users,
  ShoppingBag,
  XCircle,
  Megaphone,
  UserCog,
  ClipboardList,
} from "lucide-react"

type SidebarItem = {
  id: string
  label: string
  icon: React.ElementType
}

const sidebarItems: SidebarItem[] = [
  { id: "orders", label: "Siparişler", icon: ShoppingBag },
  { id: "users", label: "Kullanıcılar", icon: Users },
  { id: "cancelled", label: "İptal Edilenler", icon: XCircle },
  { id: "campaign", label: "Kampanya Oluştur", icon: Megaphone },
  { id: "account", label: "Barista Account", icon: UserCog },
  { id: "surveys", label: "Müşteri Anketleri", icon: ClipboardList },
]

export default function BaristaPage() {
  const { orders, broadcastUpdateStatus } = useBroadcastOrders()
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState("orders")

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    broadcastUpdateStatus(orderId, status)
    toast({
      title: "Order Updated",
      description: `Status changed to ${status}`,
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Image
            src="/images/bir-20ba-c5-9fl-c4-b1k-20ekleyin-282-29.png"
            alt="Coffee & Code Logo"
            width={140}
            height={140}
            priority
            className="h-auto w-full rounded-xl"
          />
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {sidebarItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                  ${isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">Coffee & Code · Barista Panel</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {activeSection === "orders" ? (
          <BaristaDashboard orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              {(() => {
                const item = sidebarItems.find((s) => s.id === activeSection)
                const Icon = item?.icon
                return Icon ? <Icon className="h-9 w-9 text-muted-foreground" /> : null
              })()}
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {sidebarItems.find((s) => s.id === activeSection)?.label}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Bu özellik yakında eklenecek.</p>
          </div>
        )}
      </main>
    </div>
  )
}
