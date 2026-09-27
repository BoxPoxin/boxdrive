import { createClient } from '@supabase/supabase-js'

// ── Typed schema mirroring supabase/schema.sql ──────────────────────────────

export interface UserProfile {
  id: string
  full_name: string
  phone: string
  shipping_address: string
  shipping_city: string
  shipping_pincode: string
  billing_address: string
  billing_city: string
  billing_pincode: string
  billing_same_as_shipping: boolean
  company_name: string | null
  gst_number: string | null
  created_at: string
  updated_at: string
}

export interface ProductRow {
  id: string
  name: string
  edition: string
  price_inr: number
  stock_quantity: number
  created_at: string
  updated_at: string
}

export type PaymentMethod = 'razorpay' | 'cod'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type FulfillmentStatus = 'processing' | 'shipped' | 'completed' | 'cancelled'

export interface OrderRow {
  id: string
  checkout_id: string
  user_id: string | null
  product_id: string
  quantity: number
  unit_price_inr: number
  total_inr: number
  currency: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  shipping_city: string
  shipping_pincode: string
  company_name: string | null
  gst_number: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          phone: string
          shipping_address: string
          shipping_city: string
          shipping_pincode: string
          billing_address: string
          billing_city: string
          billing_pincode: string
          billing_same_as_shipping: boolean
          company_name: string | null
          gst_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone: string
          shipping_address: string
          shipping_city: string
          shipping_pincode: string
          company_name?: string | null
          gst_number?: string | null
        }
        Update: {
          full_name?: string
          phone?: string
          shipping_address?: string
          shipping_city?: string
          shipping_pincode?: string
          billing_address?: string
          billing_city?: string
          billing_pincode?: string
          billing_same_as_shipping?: boolean
          company_name?: string | null
          gst_number?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          edition: string
          price_inr: number
          stock_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          edition: string
          price_inr: number
          stock_quantity: number
        }
        Update: {
          name?: string
          edition?: string
          price_inr?: number
          stock_quantity?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          checkout_id: string
          user_id: string | null
          product_id: string
          quantity: number
          unit_price_inr: number
          total_inr: number
          currency: string
          payment_method: PaymentMethod
          payment_status: PaymentStatus
          fulfillment_status: FulfillmentStatus
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          shipping_name: string
          shipping_phone: string
          shipping_address: string
          shipping_city: string
          shipping_pincode: string
          company_name: string | null
          gst_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          checkout_id?: string
          user_id: string | null
          product_id: string
          quantity: number
          unit_price_inr: number
          total_inr: number
          currency: string
          payment_method: PaymentMethod
          payment_status: PaymentStatus
          fulfillment_status?: FulfillmentStatus
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          shipping_name: string
          shipping_phone: string
          shipping_address: string
          shipping_city: string
          shipping_pincode: string
          company_name?: string | null
          gst_number?: string | null
        }
        Update: {
          payment_status?: PaymentStatus
          fulfillment_status?: FulfillmentStatus
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in website/.env to enable accounts.',
  )
}

// Falls back to placeholder values so the client can be constructed even when
// env vars are missing; isSupabaseConfigured should be checked before use.
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
