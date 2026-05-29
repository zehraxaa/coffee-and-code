"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { useBroadcastOrders } from "@/hooks/use-broadcast-orders"
import { useBroadcastCampaigns } from "@/hooks/use-broadcast-campaigns"
import { useMenuItems } from "@/hooks/use-menu-items"
import { getNextOrderNumber } from "@/lib/order-number"
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
import { LoyaltyPromptDialog } from "@/components/loyalty-prompt-dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { Order, OrderStatus } from "@/lib/types"
import { clearSupabaseAuthCache, logoutUser } from "@/lib/auth-store"
import type { StoredUser } from "@/lib/auth-store"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [activeTab, setActiveTab] = useState("home")
  const [hasSeenPromo, setHasSeenPromo] = useState(false)
  const { orders, broadcastPlaceOrder, broadcastUpdateStatus, broadcastRateOrder } = useBroadcastOrders()
  const { campaigns, splashImageUrl, loading: campaignsLoading } = useBroadcastCampaigns()
  const { loading: menuLoading } = useMenuItems()
  const [baristaMode, setBaristaMode] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [loyaltyStamps, setLoyaltyStamps] = useState(0)
  const [orderReadyNotificationOpen, setOrderReadyNotificationOpen] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<{ name: string; price: string } | null>(null)
  const [prefillOrder, setPrefillOrder] = useState<Order | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [settingsDialogType, setSettingsDialogType] = useState<"account" | "password">("account")
  const [darkMode, setDarkMode] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<Omit<Order, "id" | "timestamp"> | null>(null)
  const [showLoyaltyPrompt, setShowLoyaltyPrompt] = useState(false)
  const [freeCoffeeCode, setFreeCoffeeCode] = useState<string | null>(null)
  const [menuCategory, setMenuCategory] = useState("hot")
  const { toast } = useToast()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [activeTab])

  // Mount anında Supabase oturumunu kontrol et
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          clearSupabaseAuthCache()
          return
        }

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setIsLoggedIn(true)
            setLoggedInUser({
              id: session.user.id,
              email: profile.email,
              name: profile.name,
              surname: profile.surname,
              loyaltyStamps: profile.loyalty_stamps
            })
            setLoyaltyStamps(profile.loyalty_stamps)
          }
        }
      } catch (error) {
        console.warn("Supabase session could not be restored:", error)
        clearSupabaseAuthCache()
      }
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
        setLoggedInUser(null)
        // Çıkış yapılınca stamp sayısını ve sipariş geçmişini sıfırla
        setLoyaltyStamps(0)
        setFreeCoffeeCode(null)
        prevStatusesRef.current.clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ────────────────────────────────────────────
  // Sipariş yerleştirme
  // ────────────────────────────────────────────
  const confirmPlaceOrder = async (orderData: Omit<Order, "id" | "timestamp">, isGuest: boolean) => {
    const orderNumber = await getNextOrderNumber()
    const newOrder: Order = {
      ...orderData,
      id: crypto.randomUUID(),
      orderNumber,
      timestamp: new Date(),
      isGuest,
      // Her siparişe sahip kaydı: giriş yapmışsa UUID, misafiryse session ID
      userId: isGuest
        ? (typeof window !== "undefined"
            ? (() => {
                const key = "cc_guest_session_id"
                let id = sessionStorage.getItem(key)
                if (!id) { id = "guest_" + crypto.randomUUID(); sessionStorage.setItem(key, id) }
                return id
              })()
            : undefined)
        : (loggedInUser?.id ?? undefined),
    }
    broadcastPlaceOrder(newOrder)
    setActiveTab("activity")
    toast({ title: "Order Placed! 🎉", description: "Your order has been received." })
    setSelectedMenuItem(null)
    setPendingOrder(null)
    setPrefillOrder(null)
  }

  const handleReorder = (order: Order) => {
    setPrefillOrder(order)
    setSelectedMenuItem(null)
    setActiveTab("order")
  }

  const handlePlaceOrder = (orderData: Omit<Order, "id" | "timestamp">) => {
    if (isLoggedIn) {
      confirmPlaceOrder(orderData, false)
    } else {
      setPendingOrder(orderData)
      setShowLoyaltyPrompt(true)
    }
  }

  const handleLoyaltySignIn = () => {
    setShowLoyaltyPrompt(false)
    setActiveTab("account")
  }

  const handleLoyaltySkip = async () => {
    setShowLoyaltyPrompt(false)
    if (pendingOrder) await confirmPlaceOrder(pendingOrder, true)
  }

  // ────────────────────────────────────────────
  // Sipariş durumu güncelleme
  // ────────────────────────────────────────────
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    broadcastUpdateStatus(orderId, status)
    toast({ title: "Order Updated", description: `Order status changed to ${status}` })
  }

  // Bildirim → ready'de, Stamp → completed (Picked Up) anında
  const prevStatusesRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    orders.forEach((order) => {
      const prev = prevStatusesRef.current.get(order.id)

      if (order.status === "ready" && prev !== "ready") {
        setOrderReadyNotificationOpen(true)
      }

      if (order.status === "completed" && prev !== "completed") {
        if (!order.isGuest && loggedInUser) {
          // Daha önce bu siparişe stamp verilmişse tekrar verme
          const stampedKey = `cc_stamped_${order.id}`
          if (!localStorage.getItem(stampedKey)) {
            localStorage.setItem(stampedKey, "1")
            setLoyaltyStamps((s) => {
              const next = s + 1
              const finalStamps = next >= 8 ? 8 : next
              
              // Veritabanını güncelle
              supabase.from('profiles').update({ loyalty_stamps: finalStamps }).eq('id', loggedInUser.id).then()
              
              setTimeout(() => {
                if (next >= 8) {
                  const code = `FREE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
                  setFreeCoffeeCode(code)
                  toast({ title: "🎉 Free Coffee Earned!", description: "Your coupon is waiting in the home screen!", duration: 5000 })
                } else {
                  toast({ title: "Stamp Earned! ☕", description: `You now have ${next} stamp${next > 1 ? "s" : ""}!` })
                }
              }, 0)
              return finalStamps
            })
          }
        }
      }

      prevStatusesRef.current.set(order.id, order.status)
    })
  }, [orders, loggedInUser])

  // ────────────────────────────────────────────
  // Auth
  // ────────────────────────────────────────────
  const handleAuth = async (user: StoredUser) => {
    setIsLoggedIn(true)
    setLoggedInUser(user)
    // Yeni kullanıcının gerçek stamp sayısını yükle — önceki kullanıcının değeri taşımasın
    setLoyaltyStamps(user.loyaltyStamps ?? 0)
    // Önceki siparişlerin statü referanslarını temizle — eski siparişe stamp vermesin
    prevStatusesRef.current.clear()
    setAuthDialogOpen(false)
    toast({ title: `Welcome, ${user.name}! ☕`, description: "You've successfully signed in." })

    if (pendingOrder) {
      await confirmPlaceOrder(pendingOrder, false)
    } else if (selectedOrderId) {
      setReviewDialogOpen(true)
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    setIsLoggedIn(false)
    setLoggedInUser(null)
    // Önceki kullanıcının stamp sayısını ve sipariş geçmişini temizle
    setLoyaltyStamps(0)
    setFreeCoffeeCode(null)
    prevStatusesRef.current.clear()
    toast({ title: "Signed Out", description: "You've been signed out successfully." })
  }

  // ────────────────────────────────────────────
  // Yorum
  // ────────────────────────────────────────────
  const handleRateOrder = (orderId: string) => {
    if (!isLoggedIn) {
      setSelectedOrderId(orderId)
      setAuthDialogOpen(true)
    } else {
      setSelectedOrderId(orderId)
      setReviewDialogOpen(true)
    }
  }

  const handleSubmitReview = (rating: number, review: string) => {
    if (selectedOrderId) {
      // Her zaman güncel ismi kullan — manage account'ta değişince yorumlar yeni isimle çıkar
      const reviewerName = loggedInUser
        ? `${loggedInUser.name[0]}**** ${loggedInUser.surname[0]}****`
        : undefined
      broadcastRateOrder(selectedOrderId, rating, review, reviewerName)
      toast({ title: "Thank You!", description: "Your review has been submitted." })
      setSelectedOrderId(null)
    }
  }

  // ────────────────────────────────────────────
  // Menü
  // ────────────────────────────────────────────
  const handleMenuItemSelect = (item: { name: string; price: string }) => {
    setSelectedMenuItem(item)
    setActiveTab("order")
  }

  // ────────────────────────────────────────────
  // Ayarlar
  // ────────────────────────────────────────────
  const handleSettingsSaved = (updatedUser: StoredUser) => {
    setLoggedInUser(updatedUser)
    toast({ title: "Settings Updated", description: "Your changes have been saved." })
  }

  // ────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} isReady={!campaignsLoading && !menuLoading} />
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
              hasSeenPromo={hasSeenPromo}
              onPromoClosed={() => setHasSeenPromo(true)}
              onViewFullMenu={() => {
                setSelectedMenuItem(null)
                setPrefillOrder(null)
                setActiveTab("menu")
              }}
              loyaltyStamps={loyaltyStamps}
              freeCoffeeCode={freeCoffeeCode}
              onRedeemFreeCoffee={async () => {
                setFreeCoffeeCode(null)
                setLoyaltyStamps(0)
                if (loggedInUser?.id) {
                  const { error } = await supabase.from('profiles').update({ loyalty_stamps: 0 }).eq('id', loggedInUser.id)
                  if (error) {
                    console.error("Failed to reset stamps in database:", error)
                  }
                }
              }}
              onOrderCoffeeOfMonth={(name, price) => {
                setSelectedMenuItem({ name, price })
                setPrefillOrder(null)
                setActiveTab("order")
              }}
              onOrderFavorite={(item) => {
                setPrefillOrder(null)
                handleMenuItemSelect(item)
              }}
              campaigns={campaigns}
              orders={orders.filter((o) => !o.isGuest || o.id === selectedOrderId)}
              splashImageUrl={splashImageUrl}
            />
          )}
          {activeTab === "order" && (
            <CustomOrderForm
              onBack={() => {
                setPrefillOrder(null)
                setActiveTab(selectedMenuItem ? "menu" : "home")
              }}
              onPlaceOrder={handlePlaceOrder}
              preselectedItem={selectedMenuItem || undefined}
              orders={orders}
              prefillOrder={prefillOrder || undefined}
            />
          )}
          {activeTab === "menu" && <MenuView onBack={() => setActiveTab("home")} onSelectItem={handleMenuItemSelect} selectedCategory={menuCategory} onCategoryChange={setMenuCategory} />}
          {activeTab === "stores" && <StoresView />}
          {activeTab === "activity" && <ActivityView orders={orders} onRateOrder={handleRateOrder} onReorder={handleReorder} />}
          {activeTab === "account" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-foreground">Account & Settings</h1>

              <div className="space-y-4">
                {/* Dark mode */}
                <div className="flex items-center justify-between rounded-lg bg-card p-4">
                  <Label htmlFor="dark-mode" className="font-medium text-foreground">
                    Dark Mode
                  </Label>
                  <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                {isLoggedIn && loggedInUser ? (
                  <>
                    {/* Kullanıcı bilgi kartı */}
                    <div className="rounded-lg bg-card p-4 border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">Signed in as</p>
                      <p className="font-semibold text-foreground">{loggedInUser.name} {loggedInUser.surname}</p>
                      <p className="text-sm text-muted-foreground">{loggedInUser.email}</p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full justify-start bg-card text-foreground"
                      onClick={() => { setSettingsDialogType("account"); setSettingsDialogOpen(true) }}
                    >
                      Manage Account
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start bg-card text-foreground"
                      onClick={() => { setSettingsDialogType("password"); setSettingsDialogOpen(true) }}
                    >
                      Change Password
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start bg-card text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      Log Out
                    </Button>
                  </>
                ) : (
                  <div className="mt-8 rounded-lg border border-border p-6 text-center space-y-4">
                    <h3 className="font-semibold text-foreground text-lg">Sign In for More Features</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn loyalty stamps, track your orders and save your preferences.
                    </p>
                    <Button className="w-full bg-primary text-primary-foreground" onClick={() => setAuthDialogOpen(true)}>
                      Sign In
                    </Button>
                    <button
                      className="text-sm text-primary hover:underline block w-full text-center"
                      onClick={() => {
                        // AuthDialog'u sign-up modunda aç
                        setAuthDialogOpen(true)
                      }}
                    >
                      New here? Create an account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onAuth={handleAuth}
      />
      <ReviewDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen} onSubmit={handleSubmitReview} />
      <OrderReadyNotification open={orderReadyNotificationOpen} onOpenChange={setOrderReadyNotificationOpen} />
      <LoyaltyPromptDialog
        open={showLoyaltyPrompt}
        onSignIn={handleLoyaltySignIn}
        onSkip={handleLoyaltySkip}
      />
      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        dialogType={settingsDialogType}
        currentUser={loggedInUser}
        onSaved={handleSettingsSaved}
      />
    </>
  )
}
