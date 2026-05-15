import { supabase } from "@/lib/supabase"

export interface StoredUser {
  id: string
  email: string
  name: string
  surname: string
  loyaltyStamps?: number
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  surname: string
): Promise<{ success: boolean; error?: string; user?: StoredUser }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: { name, surname }
      }
    })

    if (authError) return { success: false, error: authError.message }
    if (!authData.user) return { success: false, error: "No user returned from Supabase." }

    // Create profile in database
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: authData.user.email!,
      name,
      surname,
      loyalty_stamps: 0
    })

    if (profileError) return { success: false, error: profileError.message }

    return { 
      success: true, 
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        name,
        surname,
        loyaltyStamps: 0
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: StoredUser | null; error?: string }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })

    if (authError) return { user: null, error: authError.message }
    if (!authData.user) return { user: null, error: "Login failed." }

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profileData) {
      return { user: null, error: "Profile not found." }
    }

    return { 
      user: {
        id: authData.user.id,
        email: profileData.email,
        name: profileData.name,
        surname: profileData.surname,
        loyaltyStamps: profileData.loyalty_stamps
      }
    }
  } catch (err: any) {
    return { user: null, error: err.message }
  }
}

export async function updateUser(
  userId: string,
  updates: Partial<Pick<StoredUser, "name" | "surname" | "email">>
): Promise<{ success: boolean; error?: string; updatedUser?: StoredUser }> {
  try {
    const profileUpdates: any = {}
    if (updates.name) profileUpdates.name = updates.name
    if (updates.surname) profileUpdates.surname = updates.surname
    if (updates.email) profileUpdates.email = updates.email.toLowerCase()

    if (updates.email) {
      // Update email in Auth
      const { error: authError } = await supabase.auth.updateUser({ email: updates.email.toLowerCase() })
      if (authError) return { success: false, error: authError.message }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    return { 
      success: true, 
      updatedUser: {
        id: data.id,
        email: data.email,
        name: data.name,
        surname: data.surname,
        loyaltyStamps: data.loyalty_stamps
      } 
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function changePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function logoutUser() {
  await supabase.auth.signOut()
}

export function clearSupabaseAuthCache() {
  if (typeof window === "undefined") return

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))
    .forEach((key) => window.localStorage.removeItem(key))
}
