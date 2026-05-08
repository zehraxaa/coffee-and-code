"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (rating: number, review: string) => void
}

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"]

export function ReviewDialog({ open, onOpenChange, onSubmit }: ReviewDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setRating(0)
      setHoveredRating(0)
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, "") // review text kaldırıldı
      setRating(0)
      setHoveredRating(0)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Rate Your Order</DialogTitle>
          <DialogDescription className="text-center">
            How was your coffee experience?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Stars */}
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 active:scale-95"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-11 w-11 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "fill-accent text-accent"
                      : "fill-none text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Label */}
          <p className={`text-sm font-medium transition-opacity ${rating > 0 ? "opacity-100" : "opacity-0"}`}>
            {LABELS[hoveredRating || rating]}
          </p>

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            Submit Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
