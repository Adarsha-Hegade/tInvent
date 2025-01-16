export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          model_no: string
          name: string
          description: string | null
          size: string | null
          finish: string | null
          manufacturer: string | null
          total_stock: number
          bad_stock: number
          bookings: number
          available_stock: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          model_no: string
          name: string
          description?: string | null
          size?: string | null
          finish?: string | null
          manufacturer?: string | null
          total_stock?: number
          bad_stock?: number
          bookings?: number
        }
        Update: {
          id?: string
          model_no?: string
          name?: string
          description?: string | null
          size?: string | null
          finish?: string | null
          manufacturer?: string | null
          total_stock?: number
          bad_stock?: number
          bookings?: number
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          product_id: string
          quantity: number
          status: 'pending' | 'confirmed' | 'cancelled'
          booking_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          product_id: string
          quantity: number
          status?: 'pending' | 'confirmed' | 'cancelled'
          booking_date?: string
        }
        Update: {
          id?: string
          customer_id?: string
          product_id?: string
          quantity?: number
          status?: 'pending' | 'confirmed' | 'cancelled'
          booking_date?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'admin' | 'manager' | 'viewer'
          assigned_columns: string[]
          access_level: 'read' | 'write' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'viewer'
          assigned_columns?: string[]
          access_level?: 'read' | 'write' | 'admin'
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'viewer'
          assigned_columns?: string[]
          access_level?: 'read' | 'write' | 'admin'
        }
      }
    }
  }
}