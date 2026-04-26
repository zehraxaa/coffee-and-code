"use client"

import { Star, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoyaltyPromptDialogProps {
  open: boolean
  onSignIn: () => void
  onSkip: () => void
}

export function LoyaltyPromptDialog({ open, onSignIn, onSkip }: LoyaltyPromptDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

        {/* Icon + text */}
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="mx-auto mb-4 relative flex h-20 w-20 items-center justify-center">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/30">
              <Star className="h-9 w-9 text-primary fill-primary/80" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground">Earn a Stamp!</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Would you like to sign in to earn a stamp for this order?
            Collect <span className="font-semibold text-foreground">10 stamps</span> and get a{" "}
            <span className="font-semibold text-primary">free coffee</span>!
          </p>

          {/* Stamp preview */}
          <div className="mt-4 flex justify-center gap-1.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  i === 0
                    ? "border-primary bg-primary"
                    : "border-border bg-muted/30"
                }`}
              >
                {i === 0 && <Coffee className="h-2.5 w-2.5 text-primary-foreground" />}
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">1 stamp earned per order</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 px-6 pb-8">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold shadow-md"
            onClick={onSignIn}
          >
            <Star className="mr-2 h-4 w-4 fill-primary-foreground" />
            Let's Sign In!
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground h-11"
            onClick={onSkip}
          >
            No Thank You
          </Button>
        </div>
      </div>
    </div>
  )
}
