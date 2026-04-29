"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coffee, AlertCircle } from "lucide-react"
import { loginUser, registerUser } from "@/lib/auth-store"
import type { StoredUser } from "@/lib/auth-store"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Başarılı auth sonrası tam kullanıcı objesiyle çağrılır */
  onAuth: (user: StoredUser) => void
  /** Başlangıçta sign-up formunu aç (opsiyonel) */
  defaultSignUp?: boolean
}

export function AuthDialog({ open, onOpenChange, onAuth, defaultSignUp = false }: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(defaultSignUp)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setEmail("")
    setPassword("")
    setName("")
    setSurname("")
    setError(null)
  }

  const switchMode = () => {
    setIsSignUp((v) => !v)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isSignUp) {
      if (!name.trim() || !surname.trim()) {
        setError("Name and surname are required.")
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.")
        setLoading(false)
        return
      }
      const result = registerUser(email, password, name.trim(), surname.trim())
      if (!result.success) {
        setError(result.error || "Registration failed.")
        setLoading(false)
        return
      }
      // Kayıt başarılı → direkt giriş yaptır
      onAuth({ email: email.toLowerCase(), password, name: name.trim(), surname: surname.trim() })
    } else {
      const result = loginUser(email, password)
      if (!result.user) {
        setError(result.error || "Login failed.")
        setLoading(false)
        return
      }
      onAuth(result.user)
    }

    reset()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Coffee className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSignUp
              ? "Sign up to earn rewards and track your orders"
              : "Sign in to your Coffee & Code account"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Name + Surname — sign up only */}
          {isSignUp && (
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="auth-name">Name</Label>
                <Input
                  id="auth-name"
                  placeholder="Jane"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="auth-surname">Surname</Label>
                <Input
                  id="auth-surname"
                  placeholder="Doe"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignUp ? 6 : 1}
            />
            {isSignUp && (
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {isSignUp ? "Create Account" : "Sign In"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={switchMode}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
