"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Coffee, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

interface OrderReadyNotificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderReadyNotification({ open, onOpenChange }: OrderReadyNotificationProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative mb-6"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary">
              <Coffee className="h-12 w-12 text-primary-foreground" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="absolute -right-2 -top-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </motion.div>
          </motion.div>

          <h2 className="text-2xl font-bold text-foreground">Your Order is Ready!</h2>
          <p className="mt-2 text-muted-foreground">Please pick it up at the counter.</p>

          <Button
            size="lg"
            className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onOpenChange(false)}
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
