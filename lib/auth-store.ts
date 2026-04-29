// Gerçek bir backend yokken kullanıcıları localStorage'da saklayan auth katmanı

export interface StoredUser {
  email: string
  password: string
  name: string
  surname: string
}

const STORAGE_KEY = "cc_users"

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

/** Yeni kullanıcı kaydeder. Email zaten varsa false döner. */
export function registerUser(
  email: string,
  password: string,
  name: string,
  surname: string
): { success: boolean; error?: string } {
  const users = getUsers()
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "This email is already registered." }
  }
  users.push({ email: email.toLowerCase(), password, name, surname })
  saveUsers(users)
  return { success: true }
}

/** Email + şifre doğrular. Başarılı ise kullanıcıyı döner. */
export function loginUser(
  email: string,
  password: string
): { user: StoredUser | null; error?: string } {
  const users = getUsers()
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!found) {
    return { user: null, error: "No account found with this email. Please sign up first." }
  }
  if (found.password !== password) {
    return { user: null, error: "Incorrect password." }
  }
  return { user: found }
}

/** Kullanıcı bilgilerini günceller (ad, soyad, email, şifre). */
export function updateUser(
  currentEmail: string,
  updates: Partial<Pick<StoredUser, "name" | "surname" | "email" | "password">>
): { success: boolean; error?: string; updatedUser?: StoredUser } {
  const users = getUsers()
  const idx = users.findIndex((u) => u.email.toLowerCase() === currentEmail.toLowerCase())
  if (idx === -1) return { success: false, error: "User not found." }

  // Email değişiyorsa başka kullanıcıda var mı kontrol et
  if (updates.email && updates.email.toLowerCase() !== currentEmail.toLowerCase()) {
    const emailTaken = users.find((u) => u.email.toLowerCase() === updates.email!.toLowerCase())
    if (emailTaken) return { success: false, error: "This email is already in use." }
  }

  users[idx] = { ...users[idx], ...updates }
  saveUsers(users)
  return { success: true, updatedUser: users[idx] }
}

/** Şifre değişikliği — mevcut şifreyi doğrular. */
export function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  const users = getUsers()
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase())
  if (idx === -1) return { success: false, error: "User not found." }
  if (users[idx].password !== currentPassword) {
    return { success: false, error: "Current password is incorrect." }
  }
  users[idx].password = newPassword
  saveUsers(users)
  return { success: true }
}
