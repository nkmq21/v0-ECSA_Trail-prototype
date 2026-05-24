// Auto-generated from Supabase schema — run `npm run gen:types` after applying migrations to regenerate.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]


export type Database = {
  public: {
    Tables: {
      ai_subscription: {
        Row: {
          id: string
          user_id: string
          status: Database['public']['Enums']['subscription_status']
          payment_service_subscription_id: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: Database['public']['Enums']['subscription_status']
          payment_service_subscription_id?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: Database['public']['Enums']['subscription_status']
          payment_service_subscription_id?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'ai_subscription_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profile'; referencedColumns: ['id'] }
        ]
      }
      chat_message: {
        Row: {
          id: string
          session_id: string
          role: Database['public']['Enums']['chat_role']
          content: string
          tool_name: string | null
          tool_input: Json | null
          tool_output: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: Database['public']['Enums']['chat_role']
          content: string
          tool_name?: string | null
          tool_input?: Json | null
          tool_output?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: Database['public']['Enums']['chat_role']
          content?: string
          tool_name?: string | null
          tool_input?: Json | null
          tool_output?: Json | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'chat_message_session_id_fkey'; columns: ['session_id']; referencedRelation: 'chat_session'; referencedColumns: ['id'] }
        ]
      }
      chat_session: {
        Row: {
          id: string
          user_id: string
          plan_id: string | null
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id?: string | null
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string | null
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'chat_session_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profile'; referencedColumns: ['id'] }
        ]
      }
      place: {
        Row: {
          id: string
          name: string
          name_en: string
          province: string
          lat: number
          lng: number
          category: Database['public']['Enums']['place_category']
          credibility_score: number
          sources_count: number
          source_verified: boolean
          description: string | null
          image_url: string | null
          duration_hours: number | null
          indoor: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          name_en: string
          province: string
          lat: number
          lng: number
          category: Database['public']['Enums']['place_category']
          credibility_score: number
          sources_count?: number
          description?: string | null
          image_url?: string | null
          duration_hours?: number | null
          indoor?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_en?: string
          province?: string
          lat?: number
          lng?: number
          category?: Database['public']['Enums']['place_category']
          credibility_score?: number
          sources_count?: number
          description?: string | null
          image_url?: string | null
          duration_hours?: number | null
          indoor?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      place_source: {
        Row: {
          id: string
          place_id: string
          source_type: Database['public']['Enums']['place_source_type']
          source_url: string | null
          fetched_at: string
        }
        Insert: {
          id?: string
          place_id: string
          source_type: Database['public']['Enums']['place_source_type']
          source_url?: string | null
          fetched_at?: string
        }
        Update: {
          id?: string
          place_id?: string
          source_type?: Database['public']['Enums']['place_source_type']
          source_url?: string | null
          fetched_at?: string
        }
        Relationships: [
          { foreignKeyName: 'place_source_place_id_fkey'; columns: ['place_id']; referencedRelation: 'place'; referencedColumns: ['id'] }
        ]
      }
      plan: {
        Row: {
          id: string
          creator_id: string
          title: string
          title_vi: string | null
          price: number
          province: string
          provinces: string[]
          duration_days: number
          difficulty: Database['public']['Enums']['plan_difficulty']
          category: Database['public']['Enums']['plan_category']
          cover_image_url: string | null
          highlights: string[]
          highlights_vi: string[]
          tags: string[]
          ai_verified: boolean
          fact_checked: boolean
          includes_transport: boolean
          includes_tips: boolean
          includes_media: boolean
          status: Database['public']['Enums']['plan_status']
          purchase_count: number
          rating: number
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          title_vi?: string | null
          price?: number
          province: string
          provinces?: string[]
          duration_days: number
          difficulty?: Database['public']['Enums']['plan_difficulty']
          category: Database['public']['Enums']['plan_category']
          cover_image_url?: string | null
          highlights?: string[]
          highlights_vi?: string[]
          tags?: string[]
          ai_verified?: boolean
          fact_checked?: boolean
          includes_transport?: boolean
          includes_tips?: boolean
          includes_media?: boolean
          status?: Database['public']['Enums']['plan_status']
          purchase_count?: number
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          title_vi?: string | null
          price?: number
          province?: string
          provinces?: string[]
          duration_days?: number
          difficulty?: Database['public']['Enums']['plan_difficulty']
          category?: Database['public']['Enums']['plan_category']
          cover_image_url?: string | null
          highlights?: string[]
          highlights_vi?: string[]
          tags?: string[]
          ai_verified?: boolean
          fact_checked?: boolean
          includes_transport?: boolean
          includes_tips?: boolean
          includes_media?: boolean
          status?: Database['public']['Enums']['plan_status']
          purchase_count?: number
          rating?: number
          review_count?: number
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'plan_creator_id_fkey'; columns: ['creator_id']; referencedRelation: 'profile'; referencedColumns: ['id'] }
        ]
      }
      profile: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          bio: string | null
          province: string | null
          verified: boolean
          total_plans: number
          total_sales: number
          rating: number
          review_count: number
          joined_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          bio?: string | null
          province?: string | null
          verified?: boolean
          total_plans?: number
          total_sales?: number
          rating?: number
          review_count?: number
          joined_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          bio?: string | null
          province?: string | null
          verified?: boolean
          total_plans?: number
          total_sales?: number
          rating?: number
          review_count?: number
          joined_at?: string
        }
        Relationships: []
      }
      purchased_plan: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          purchased_at: string
          ai_tier: Database['public']['Enums']['ai_tier'] | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          purchased_at?: string
          ai_tier?: Database['public']['Enums']['ai_tier'] | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          purchased_at?: string
          ai_tier?: Database['public']['Enums']['ai_tier'] | null
          notes?: string | null
        }
        Relationships: [
          { foreignKeyName: 'purchased_plan_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profile'; referencedColumns: ['id'] },
          { foreignKeyName: 'purchased_plan_plan_id_fkey'; columns: ['plan_id']; referencedRelation: 'plan'; referencedColumns: ['id'] }
        ]
      }
      review: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          rating: number
          comment: string | null
          comment_vi: string | null
          helpful_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          rating: number
          comment?: string | null
          comment_vi?: string | null
          helpful_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          rating?: number
          comment?: string | null
          comment_vi?: string | null
          helpful_count?: number
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'review_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profile'; referencedColumns: ['id'] },
          { foreignKeyName: 'review_plan_id_fkey'; columns: ['plan_id']; referencedRelation: 'plan'; referencedColumns: ['id'] }
        ]
      }
      stop: {
        Row: {
          id: string
          plan_id: string | null
          purchased_plan_id: string | null
          alert_id: string | null
          replaces_stop_id: string | null
          place_id: string
          stop_order: number
          travel_time_min: number
          transport_mode: Database['public']['Enums']['transport_mode']
          notes: string | null
        }
        Insert: {
          id?: string
          plan_id?: string | null
          purchased_plan_id?: string | null
          alert_id?: string | null
          replaces_stop_id?: string | null
          place_id: string
          stop_order: number
          travel_time_min?: number
          transport_mode?: Database['public']['Enums']['transport_mode']
          notes?: string | null
        }
        Update: {
          id?: string
          plan_id?: string | null
          purchased_plan_id?: string | null
          alert_id?: string | null
          replaces_stop_id?: string | null
          place_id?: string
          stop_order?: number
          travel_time_min?: number
          transport_mode?: Database['public']['Enums']['transport_mode']
          notes?: string | null
        }
        Relationships: [
          { foreignKeyName: 'stop_plan_id_fkey'; columns: ['plan_id']; referencedRelation: 'plan'; referencedColumns: ['id'] },
          { foreignKeyName: 'stop_purchased_plan_id_fkey'; columns: ['purchased_plan_id']; referencedRelation: 'purchased_plan'; referencedColumns: ['id'] }
        ]
      }
      trip: {
        Row: {
          id: string
          user_id: string
          purchased_plan_id: string
          start_date: string
          end_date: string | null
          status: Database['public']['Enums']['trip_status']
          active_plan: Database['public']['Enums']['plan_variant']
          push_subscription: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          purchased_plan_id: string
          start_date: string
          end_date?: string | null
          status?: Database['public']['Enums']['trip_status']
          active_plan?: Database['public']['Enums']['plan_variant']
          push_subscription?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          purchased_plan_id?: string
          start_date?: string
          end_date?: string | null
          status?: Database['public']['Enums']['trip_status']
          active_plan?: Database['public']['Enums']['plan_variant']
          push_subscription?: Json | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'trip_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profile'; referencedColumns: ['id'] },
          { foreignKeyName: 'trip_purchased_plan_id_fkey'; columns: ['purchased_plan_id']; referencedRelation: 'purchased_plan'; referencedColumns: ['id'] }
        ]
      }
      weather_alert: {
        Row: {
          id: string
          trip_id: string
          type: Database['public']['Enums']['weather_type']
          severity: Database['public']['Enums']['alert_severity']
          message: string
          message_vi: string | null
          affected_place_ids: string[]
          plan_b_generated: boolean
          user_decision: Database['public']['Enums']['alert_decision'] | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          type: Database['public']['Enums']['weather_type']
          severity: Database['public']['Enums']['alert_severity']
          message: string
          message_vi?: string | null
          affected_place_ids?: string[]
          plan_b_generated?: boolean
          user_decision?: Database['public']['Enums']['alert_decision'] | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          type?: Database['public']['Enums']['weather_type']
          severity?: Database['public']['Enums']['alert_severity']
          message?: string
          message_vi?: string | null
          affected_place_ids?: string[]
          plan_b_generated?: boolean
          user_decision?: Database['public']['Enums']['alert_decision'] | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'weather_alert_trip_id_fkey'; columns: ['trip_id']; referencedRelation: 'trip'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: {
      province_stats: {
        Row: {
          province: string | null
          landmarks: number | null
          avg_credibility: number | null
          facebook_hits: number | null
          google_maps_hits: number | null
          blog_hits: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      purchase_plan_atomic: {
        Args: {
          p_user_id: string
          p_plan_id: string
          p_ai_tier?: Database['public']['Enums']['ai_tier'] | null
        }
        Returns: string
      }
      recalculate_plan_rating: {
        Args: { p_plan_id: string }
        Returns: undefined
      }
    }
    Enums: {
      ai_tier: 'per-plan' | 'monthly'
      alert_decision: 'accepted' | 'rejected'
      alert_severity: 'low' | 'medium' | 'high'
      chat_role: 'user' | 'assistant' | 'tool'
      place_category: 'temple' | 'nature' | 'beach' | 'museum' | 'food' | 'market' | 'cave'
      place_source_type: 'google_places' | 'facebook' | 'blog' | 'tripadvisor'
      plan_category: 'cultural' | 'nature' | 'food' | 'adventure' | 'beach' | 'city'
      plan_difficulty: 'easy' | 'moderate' | 'challenging'
      plan_status: 'draft' | 'published' | 'archived'
      plan_variant: 'a' | 'b'
      subscription_status: 'active' | 'cancelled' | 'expired'
      transport_mode: 'walk' | 'taxi' | 'motorbike' | 'bus'
      trip_status: 'active' | 'completed' | 'cancelled'
      weather_type: 'rain' | 'storm' | 'clear'
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
