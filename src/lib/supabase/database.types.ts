/**
 * Placeholder for generated Supabase types
 * Run: npx supabase gen types typescript --project-id sdywjxmufahnntkaevtj > src/lib/supabase/database.types.ts
 *
 * This will be replaced with the actual generated types from Supabase
 */

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
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          role: 'ADMIN' | 'USER' | 'GUEST'
          auth_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: 'ADMIN' | 'USER' | 'GUEST'
          auth_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: 'ADMIN' | 'USER' | 'GUEST'
          auth_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          email: string
          role: 'ADMIN' | 'USER' | 'GUEST'
          token: string
          status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
          expires_at: string
          sent_by_id: string
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          email: string
          role: 'ADMIN' | 'USER' | 'GUEST'
          token?: string
          status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
          expires_at: string
          sent_by_id: string
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'ADMIN' | 'USER' | 'GUEST'
          token?: string
          status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
          expires_at?: string
          sent_by_id?: string
          created_at?: string
          accepted_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          operator: string
          country: string
          language: string
          start_date: string
          end_date: string
          productive_url: string | null
          vercel_demo_url: string | null
          wp_content_prod_url: string | null
          wp_content_test_url: string | null
          chatbot_url: string | null
          comments: string | null
          card_color: string
          status: 'PLANNED' | 'IN_PROGRESS' | 'DEMO' | 'LIVE'
          created_by_id: string
          updated_by_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          operator: string
          country: string
          language: string
          start_date: string
          end_date: string
          productive_url?: string | null
          vercel_demo_url?: string | null
          wp_content_prod_url?: string | null
          wp_content_test_url?: string | null
          chatbot_url?: string | null
          comments?: string | null
          card_color?: string
          status?: 'PLANNED' | 'IN_PROGRESS' | 'DEMO' | 'LIVE'
          created_by_id: string
          updated_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          operator?: string
          country?: string
          language?: string
          start_date?: string
          end_date?: string
          productive_url?: string | null
          vercel_demo_url?: string | null
          wp_content_prod_url?: string | null
          wp_content_test_url?: string | null
          chatbot_url?: string | null
          comments?: string | null
          card_color?: string
          status?: 'PLANNED' | 'IN_PROGRESS' | 'DEMO' | 'LIVE'
          created_by_id?: string
          updated_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
          product_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
          product_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
          product_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      custom_urls: {
        Row: {
          id: string
          label: string
          url: string
          product_id: string
        }
        Insert: {
          id?: string
          label: string
          url: string
          product_id: string
        }
        Update: {
          id?: string
          label?: string
          url?: string
          product_id?: string
        }
      }
      holidays: {
        Row: {
          id: string
          date: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          name?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_auth_id: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      role: 'ADMIN' | 'USER' | 'GUEST'
      status: 'PLANNED' | 'IN_PROGRESS' | 'DEMO' | 'LIVE'
      milestone_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
      invitation_status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
    }
  }
}
