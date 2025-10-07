import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: number
          name: string
          email: string
          role: 'nurse' | 'head_nu rse'
          phone: string | null
          pic_profile: string | null
          department_id: number | null
        }
        Insert: {
          user_id?: number
          name: string
          email: string
          role: 'nurse' | 'head_nurse'
          phone?: string | null
          pic_profile?: string | null
          department_id?: number | null
        }
        Update: {
          user_id?: number
          name?: string
          email?: string
          role?: 'nurse' | 'head_nurse' | 'admin'
          phone?: string | null
          pic_profile?: string | null
          department_id?: number | null
        }
      }
      departments: {
        Row: {
          department_id: number
          department_name: string
          head_nurse_id: number | null
        }
        Insert: {
          department_id?: number
          department_name: string
          head_nurse_id?: number | null
        }
        Update: {
          department_id?: number
          department_name?: string
          head_nurse_id?: number | null
        }
      }
    }
  }
}