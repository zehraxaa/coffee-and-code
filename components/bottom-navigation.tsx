"use client"

import { Home, MapPin, ClipboardList, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "stores", label: "Stores", icon: MapPin },
    { id: "activity", label: "Orders", icon: ClipboardList },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "account", label: "Account", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={20} className={isActive ? "fill-primary/20" : ""} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
