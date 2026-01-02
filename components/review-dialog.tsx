"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (rating: number, review: string) => void
}

export function ReviewDialog({ open, onOpenChange, onSubmit }: ReviewDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [review, setReview] = useState("")

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, review)
      setRating(0)
      setReview("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Rate Your Order</DialogTitle>
          <DialogDescription>How was your coffee experience?</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating) ? "fill-accent text-accent" : "fill-none text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Review (Optional)</label>
            <Textarea
              placeholder="Tell us about your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
