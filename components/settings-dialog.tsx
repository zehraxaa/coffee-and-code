"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dialogType: "account" | "password"
  onSave: (data: { currentPassword?: string; newPassword?: string; name?: string; email?: string }) => void
}

export function SettingsDialog({ open, onOpenChange, dialogType, onSave }: SettingsDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const handleSave = () => {
    if (dialogType === "password") {
      onSave({ currentPassword, newPassword })
    } else {
      onSave({ name, email })
    }
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setName("")
    setEmail("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogType === "password" ? "Change Password" : "Manage Account"}</DialogTitle>
          <DialogDescription>
            {dialogType === "password"
              ? "Update your password to keep your account secure"
              : "Update your account information"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {dialogType === "password" ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
