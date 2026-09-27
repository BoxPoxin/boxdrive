import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase, type UserProfile } from './supabaseClient'

export interface SignUpInput {
  fullName: string
  email: string
  password: string
  phone: string
  address: string
  city: string
  pincode: string
}

export interface LogInInput {
  email: string
  password: string
}

export interface ProfileUpdateInput {
  fullName: string
  phone: string
  shippingAddress: string
  shippingCity: string
  shippingPincode: string
  billingAddress: string
  billingCity: string
  billingPincode: string
  billingSameAsShipping: boolean
}

type AuthContextValue = {
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signUp: (input: SignUpInput) => Promise<{ needsEmailConfirmation: boolean }>
  logIn: (input: LogInInput) => Promise<void>
  logOut: () => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateProfile: (input: ProfileUpdateInput) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
  if (error) {
    console.error('Failed to load profile:', error)
    return null
  }
  // If no profile row exists (e.g. the on_auth_user_created trigger didn't fire),
  // create a blank one so the rest of the app works correctly.
  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        full_name: '',
        phone: '',
        shipping_address: '',
        shipping_city: '',
        shipping_pincode: '',
      })
      .select('*')
      .single()
    if (insertError) {
      console.error('Failed to create profile:', insertError)
      return null
    }
    return created
  }
  return data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) setProfile(await fetchProfile(data.session.user.id))
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      setProfile(nextSession ? await fetchProfile(nextSession.user.id) : null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (input: SignUpInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          phone: input.phone,
          shipping_address: input.address,
          shipping_city: input.city,
          shipping_pincode: input.pincode,
        },
      },
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Sign up failed. Please try again.')

    // The public.users profile row is created server-side by the
    // `on_auth_user_created` Postgres trigger (see supabase/schema.sql).
    if (!data.session) {
      return { needsEmailConfirmation: true }
    }
    setProfile(await fetchProfile(data.user.id))
    return { needsEmailConfirmation: false }
  }, [])

  const logIn = useCallback(async (input: LogInInput) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })
    if (error) throw new Error(error.message)
  }, [])

  const logOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw new Error(error.message)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw new Error(error.message)
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(error.message)
  }, [])

  const updateProfile = useCallback(async (input: ProfileUpdateInput) => {
    if (!session) throw new Error('You must be logged in.')
    const { error } = await supabase
      .from('users')
      .update({
        full_name: input.fullName,
        phone: input.phone,
        shipping_address: input.shippingAddress,
        shipping_city: input.shippingCity,
        shipping_pincode: input.shippingPincode,
        billing_address: input.billingAddress,
        billing_city: input.billingCity,
        billing_pincode: input.billingPincode,
        billing_same_as_shipping: input.billingSameAsShipping,
      })
      .eq('id', session.user.id)
    if (error) throw new Error(error.message)
    setProfile(await fetchProfile(session.user.id))
  }, [session])

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      signUp,
      logIn,
      logOut,
      resendConfirmation,
      resetPassword,
      updatePassword,
      updateProfile,
    }),
    [
      session,
      profile,
      loading,
      signUp,
      logIn,
      logOut,
      resendConfirmation,
      resetPassword,
      updatePassword,
      updateProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
