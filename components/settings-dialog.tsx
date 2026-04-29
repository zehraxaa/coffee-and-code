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
import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { updateUser, changePassword } from "@/lib/auth-store"
import type { StoredUser } from "@/lib/auth-store"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dialogType: "account" | "password"
  currentUser: StoredUser | null
  /** Güncellenen kullanıcı bilgisi ile çağrılır */
  onSaved: (updatedUser: StoredUser) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  dialogType,
  currentUser,
  onSaved,
}: SettingsDialogProps) {
  // Account fields
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [email, setEmail] = useState("")

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Dialog açıldığında mevcut kullanıcı bilgilerini önceden doldur
  useEffect(() => {
    if (open && currentUser) {
      setName(currentUser.name)
      setSurname(currentUser.surname)
      setEmail(currentUser.email)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setError(null)
      setSuccess(null)
    }
  }, [open, currentUser])

  const handleSave = () => {
    setError(null)
    setSuccess(null)

    if (!currentUser) return

    if (dialogType === "password") {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("Please fill in all password fields.")
        return
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters.")
        return
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
      const result = changePassword(currentUser.email, currentPassword, newPassword)
      if (!result.success) {
        setError(result.error || "Failed to change password.")
        return
      }
      setSuccess("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      // Şifre değişikliğinde kullanıcı objesini de güncelle
      onSaved({ ...currentUser, password: newPassword })
    } else {
      if (!name.trim() || !surname.trim() || !email.trim()) {
        setError("Name, surname and email are required.")
        return
      }
      const result = updateUser(currentUser.email, {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim().toLowerCase(),
      })
      if (!result.success) {
        setError(result.error || "Failed to update account.")
        return
      }
      setSuccess("Account updated successfully!")
      onSaved(result.updatedUser!)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogType === "password" ? "Change Password" : "Manage Account"}</DialogTitle>
          <DialogDescription>
            {dialogType === "password"
              ? "Update your password to keep your account secure"
              : "Update your name, surname or email"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Error / success banners */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {dialogType === "password" ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-3">
                <div className="flex-1 grid gap-2">
                  <Label htmlFor="settings-name">Name</Label>
                  <Input
                    id="settings-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane"
                  />
                </div>
                <div className="flex-1 grid gap-2">
                  <Label htmlFor="settings-surname">Surname</Label>
                  <Input
                    id="settings-surname"
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
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
