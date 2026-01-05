"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { SplashScreen } from "@/components/splash-screen"
import { BottomNavigation } from "@/components/bottom-navigation"
import { HomeView } from "@/components/home-view"
import { CustomOrderForm } from "@/components/custom-order-form"
import { ActivityView } from "@/components/activity-view"
import { BaristaDashboard } from "@/components/barista-dashboard"
import { AuthDialog } from "@/components/auth-dialog"
import { ReviewDialog } from "@/components/review-dialog"
import { MenuView } from "@/components/menu-view"
import { OrderReadyNotification } from "@/components/order-ready-notification"
import { StoresView } from "@/components/stores-view"
import { SettingsDialog } from "@/components/settings-dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { Order, OrderStatus } from "@/lib/types"

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [activeTab, setActiveTab] = useState("home")
  const [orders, setOrders] = useState<Order[]>([])
  const [baristaMode, setBaristaMode] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [loyaltyStamps, setLoyaltyStamps] = useState(0)
  const [orderReadyNotificationOpen, setOrderReadyNotificationOpen] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<{ name: string; price: string } | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [settingsDialogType, setSettingsDialogType] = useState<"account" | "password">("account")
  const [darkMode, setDarkMode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  useEffect(() => {
    // Scroll to top when tab changes
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [activeTab])

  const handlePlaceOrder = (orderData: Omit<Order, "id" | "timestamp">) => {
    const newOrder: Order = {
      ...orderData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    setOrders((prev) => [newOrder, ...prev])
    setActiveTab("activity")

    toast({
      title: "Order Placed! 🎉",
      description: "Your order has been received.",
    })

    setSelectedMenuItem(null)
  }

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)))

    if (status === "ready") {
      setOrderReadyNotificationOpen(true)
      setLoyaltyStamps((prev) => {
        const newStampCount = prev + 1
        if (newStampCount >= 10) {
          toast({
            title: "🎉 Free Coffee Earned!",
            description: "You've collected 10 stamps! Enjoy your free coffee!",
            duration: 5000,
          })
          return 0
        } else {
          toast({
            title: "Stamp Earned! ☕",
            description: `You now have ${newStampCount} stamp${newStampCount > 1 ? "s" : ""}!`,
          })
          return newStampCount
        }
      })
    }

    toast({
      title: "Order Updated",
      description: `Order status changed to ${status}`,
    })
  }

  const handleRateOrder = (orderId: string) => {
    if (!isLoggedIn) {
      setSelectedOrderId(orderId)
      setAuthDialogOpen(true)
    } else {
      setSelectedOrderId(orderId)
      setReviewDialogOpen(true)
    }
  }

  const handleAuth = (email: string, password: string) => {
    setIsLoggedIn(true)
    setAuthDialogOpen(false)
    toast({
      title: "Welcome!",
      description: "You've successfully signed in.",
    })
    if (selectedOrderId) {
      setReviewDialogOpen(true)
    }
  }

  const handleSubmitReview = (rating: number, review: string) => {
    if (selectedOrderId) {
      setOrders((prev) => prev.map((order) => (order.id === selectedOrderId ? { ...order, rating, review } : order)))
      toast({
        title: "Thank You!",
        description: "Your review has been submitted.",
      })
      setSelectedOrderId(null)
    }
  }

  const handleMenuItemSelect = (item: { name: string; price: string }) => {
    setSelectedMenuItem(item)
    setActiveTab("order")
  }

  const handleSettingsSave = (data: {
    currentPassword?: string
    newPassword?: string
    name?: string
    email?: string
  }) => {
    setSettingsDialogOpen(false)
    toast({
      title: "Settings Updated",
      description: "Your changes have been saved successfully.",
    })
  }

  const handleOpenAccountSettings = () => {
    setSettingsDialogType("account")
    setSettingsDialogOpen(true)
  }

  const handleOpenPasswordSettings = () => {
    setSettingsDialogType("password")
    setSettingsDialogOpen(true)
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  if (baristaMode) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <main className="mx-auto max-w-md p-4">
          <div className="mb-6 flex items-center justify-between rounded-lg bg-card p-4">
            <Label htmlFor="barista-mode" className="font-semibold text-foreground">
              Barista Mode
            </Label>
            <Switch id="barista-mode" checked={baristaMode} onCheckedChange={setBaristaMode} />
          </div>
          <BaristaDashboard orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
        </main>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        <main className="mx-auto max-w-md p-4">
          {activeTab === "home" && (
            <HomeView
              onCreateCustomOrder={() => {
                setSelectedMenuItem(null)
                setActiveTab("order")
              }}
              onViewFullMenu={() => setActiveTab("menu")}
              loyaltyStamps={loyaltyStamps}
              onOrderCoffeeOfMonth={() => {
                setSelectedMenuItem({ name: "Spanish Latte", price: "$4.50" })
                setActiveTab("order")
              }}
              onOrderFavorite={(item) => handleMenuItemSelect(item)}
            />
          )}
          {activeTab === "order" && (
            <CustomOrderForm
              onBack={() => setActiveTab(selectedMenuItem ? "menu" : "home")}
              onPlaceOrder={handlePlaceOrder}
              preselectedItem={selectedMenuItem || undefined}
            />
          )}
          {activeTab === "menu" && <MenuView onBack={() => setActiveTab("home")} onSelectItem={handleMenuItemSelect} />}
          {activeTab === "stores" && <StoresView />}
          {activeTab === "activity" && <ActivityView orders={orders} onRateOrder={handleRateOrder} />}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-card p-4">
                  <Label htmlFor="dark-mode" className="font-medium text-foreground">
                    Dark Mode
                  </Label>
                  <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-start bg-card text-foreground"
                  onClick={handleOpenAccountSettings}
                >
                  Manage Account
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start bg-card text-foreground"
                  onClick={handleOpenPasswordSettings}
                >
                  Change Password
                </Button>

                {isLoggedIn && (
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-card text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setIsLoggedIn(false)
                      toast({ title: "Signed Out", description: "You've been signed out successfully." })
                    }}
                  >
                    Log Out
                  </Button>
                )}
              </div>
            </div>
          )}
          {activeTab === "account" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-foreground">Account</h1>
              {isLoggedIn ? (
                <div>
                  <p className="text-muted-foreground">You're logged in!</p>
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => {
                      setIsLoggedIn(false)
                      toast({ title: "Signed Out", description: "You've been signed out successfully." })
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground">Sign in to track your orders and earn rewards.</p>
                  <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => setAuthDialogOpen(true)}>
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>

        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} onAuth={handleAuth} />
      <ReviewDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen} onSubmit={handleSubmitReview} />
      <OrderReadyNotification open={orderReadyNotificationOpen} onOpenChange={setOrderReadyNotificationOpen} />
      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        dialogType={settingsDialogType}
        onSave={handleSettingsSave}
      />
    </>
  )
}
