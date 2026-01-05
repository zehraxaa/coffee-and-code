"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coffee, Star, ChevronRight, Sparkles, Quote } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import Image from "next/image"

interface HomeViewProps {
  onCreateCustomOrder: () => void
  onViewFullMenu: () => void
  loyaltyStamps: number
  onOrderCoffeeOfMonth: () => void
  onOrderFavorite: (item: { name: string; price: string }) => void
}

export function HomeView({
  onCreateCustomOrder,
  onViewFullMenu,
  loyaltyStamps,
  onOrderCoffeeOfMonth,
  onOrderFavorite,
}: HomeViewProps) {
  const totalStamps = 10

  const testimonials = [
    { id: 1, text: "Best Latte in town!", author: "Sarah M." },
    { id: 2, text: "Love the atmosphere and friendly staff.", author: "John D." },
    { id: 3, text: "The Ethiopian coffee is amazing!", author: "Emily R." },
    { id: 4, text: "My daily coffee fix. Never disappoints.", author: "Mike T." },
  ]

  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  const campaigns = [
    {
      id: 1,
      title: "Summer Special",
      description: "Iced drinks 20% off",
      color: "bg-accent",
    },
    {
      id: 2,
      title: "Happy Hour",
      description: "3-5 PM daily discounts",
      color: "bg-primary",
    },
  ]

  const favorites = [
    { id: 1, name: "Caramel Latte", price: "100 TL", rating: 4.8 },
    { id: 2, name: "Vanilla Cappuccino", price: "100 TL", rating: 4.9 },
    { id: 3, name: "Mocha Frappuccino", price: "100 TL", rating: 4.7 },
  ]

  const coffeeOfMonth = {
    name: "Spanish Latte",
    description: "Sweet and creamier flavour",
    origin: "Spain",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-center py-4">
        <Image
          src="/images/bir-20ba-c5-9fl-c4-b1k-20ekleyin-282-29.png"
          alt="Coffee & Code Logo"
          width={200}
          height={200}
          priority
          className="h-auto w-48 rounded-2xl" // Added rounded-2xl for curved edges
        />
      </div>

      {/* Loyalty Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-primary to-accent p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-foreground/80">Loyalty Rewards</p>
            <p className="text-2xl font-bold text-primary-foreground">
              {loyaltyStamps}/{totalStamps} Stamps
            </p>
          </div>
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="mt-4 flex gap-2">
          {Array.from({ length: totalStamps }).map((_, i) => (
            <div
              key={i}
              className={`h-8 w-8 rounded-full border-2 border-primary-foreground ${
                i < loyaltyStamps ? "bg-primary-foreground" : "bg-primary-foreground/20"
              }`}
            >
              {i < loyaltyStamps && <Coffee className="h-full w-full p-1 text-primary" />}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-primary-foreground/80">
          {totalStamps - loyaltyStamps} more stamps for a free drink!
        </p>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Customer Reviews</h2>
        <Card className="relative overflow-hidden p-6">
          <Quote className="absolute right-4 top-4 h-12 w-12 text-muted/20" />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <p className="text-lg italic text-foreground">{testimonials[currentTestimonial].text}</p>
              <p className="mt-3 text-sm font-semibold text-primary">— {testimonials[currentTestimonial].author}</p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentTestimonial ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Coffee of the Month */}
      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Coffee of the Month</h2>
          <Badge variant="secondary">Featured</Badge>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-primary">{coffeeOfMonth.name}</h3>
            <p className="text-sm text-muted-foreground">{coffeeOfMonth.description}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {coffeeOfMonth.origin}
              </Badge>
            </div>
          </div>
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onOrderCoffeeOfMonth}
          >
            <Coffee className="mr-2 h-4 w-4" />
            Order Now
          </Button>
        </div>
      </Card>

      {/* Campaigns Slider */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Current Campaigns</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`min-w-[280px] p-6 ${campaign.color} border-0 text-primary-foreground`}>
                <h3 className="text-lg font-bold">{campaign.title}</h3>
                <p className="mt-1 text-sm opacity-90">{campaign.description}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Learn More
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Customer Favorites */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Customer Favorites</h2>
        <div className="space-y-3">
          {favorites.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer p-4 transition-colors hover:bg-muted/50"
              onClick={() => onOrderFavorite(item)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Coffee className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-primary">{item.price}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        <span className="text-xs text-muted-foreground">{item.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="space-y-3 pb-6">
        <Button
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onCreateCustomOrder}
        >
          <Coffee className="mr-2 h-5 w-5" />
          Create Custom Order
        </Button>
        <Button size="lg" variant="outline" className="w-full bg-transparent" onClick={onViewFullMenu}>
          View Full Menu
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
