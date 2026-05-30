export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_subscription: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          payment_service_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          payment_service_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          payment_service_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_subscription_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_tier: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          min_exp: number
          name: string
          rank: number
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          min_exp: number
          name: string
          rank: number
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          min_exp?: number
          name?: string
          rank?: number
        }
        Relationships: []
      }
      challenge_instance: {
        Row: {
          completed_at: string | null
          created_at: string
          exp_reward: number
          id: string
          points_reward: number
          purchased_stop_id: string
          status: Database["public"]["Enums"]["challenge_status"]
          template_id: string
          trip_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          exp_reward: number
          id?: string
          points_reward: number
          purchased_stop_id: string
          status?: Database["public"]["Enums"]["challenge_status"]
          template_id: string
          trip_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          exp_reward?: number
          id?: string
          points_reward?: number
          purchased_stop_id?: string
          status?: Database["public"]["Enums"]["challenge_status"]
          template_id?: string
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_instance_purchased_stop_id_fkey"
            columns: ["purchased_stop_id"]
            isOneToOne: false
            referencedRelation: "stop"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_instance_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "stop_challenge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_instance_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_instance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message: {
        Row: {
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["chat_role"]
          session_id: string
          tool_input: Json | null
          tool_name: string | null
          tool_output: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["chat_role"]
          session_id: string
          tool_input?: Json | null
          tool_name?: string | null
          tool_output?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["chat_role"]
          session_id?: string
          tool_input?: Json | null
          tool_name?: string | null
          tool_output?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_session"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_session: {
        Row: {
          created_at: string
          id: string
          plan_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_session_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      place: {
        Row: {
          category: Database["public"]["Enums"]["place_category"]
          created_at: string
          credibility_score: number
          description: string | null
          duration_hours: number | null
          id: string
          image_url: string | null
          indoor: boolean
          lat: number
          lng: number
          name: string
          name_en: string
          province: string
          source_verified: boolean
          sources_count: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["place_category"]
          created_at?: string
          credibility_score: number
          description?: string | null
          duration_hours?: number | null
          id: string
          image_url?: string | null
          indoor?: boolean
          lat: number
          lng: number
          name: string
          name_en: string
          province: string
          source_verified?: boolean
          sources_count?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["place_category"]
          created_at?: string
          credibility_score?: number
          description?: string | null
          duration_hours?: number | null
          id?: string
          image_url?: string | null
          indoor?: boolean
          lat?: number
          lng?: number
          name?: string
          name_en?: string
          province?: string
          source_verified?: boolean
          sources_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      place_source: {
        Row: {
          fetched_at: string
          id: string
          place_id: string
          source_type: Database["public"]["Enums"]["place_source_type"]
          source_url: string | null
        }
        Insert: {
          fetched_at?: string
          id?: string
          place_id: string
          source_type: Database["public"]["Enums"]["place_source_type"]
          source_url?: string | null
        }
        Update: {
          fetched_at?: string
          id?: string
          place_id?: string
          source_type?: Database["public"]["Enums"]["place_source_type"]
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "place_source_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place"
            referencedColumns: ["id"]
          },
        ]
      }
      plan: {
        Row: {
          ai_verified: boolean
          category: Database["public"]["Enums"]["plan_category"]
          cover_image_url: string | null
          created_at: string
          creator_id: string
          difficulty: Database["public"]["Enums"]["plan_difficulty"]
          duration_days: number
          fact_checked: boolean
          highlights: string[]
          highlights_vi: string[]
          id: string
          includes_media: boolean
          includes_tips: boolean
          includes_transport: boolean
          price: number
          province: string
          provinces: string[]
          purchase_count: number
          rating: number
          review_count: number
          status: Database["public"]["Enums"]["plan_status"]
          tags: string[]
          title: string
          title_vi: string | null
          updated_at: string
        }
        Insert: {
          ai_verified?: boolean
          category: Database["public"]["Enums"]["plan_category"]
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          difficulty?: Database["public"]["Enums"]["plan_difficulty"]
          duration_days: number
          fact_checked?: boolean
          highlights?: string[]
          highlights_vi?: string[]
          id?: string
          includes_media?: boolean
          includes_tips?: boolean
          includes_transport?: boolean
          price?: number
          province: string
          provinces?: string[]
          purchase_count?: number
          rating?: number
          review_count?: number
          status?: Database["public"]["Enums"]["plan_status"]
          tags?: string[]
          title: string
          title_vi?: string | null
          updated_at?: string
        }
        Update: {
          ai_verified?: boolean
          category?: Database["public"]["Enums"]["plan_category"]
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          difficulty?: Database["public"]["Enums"]["plan_difficulty"]
          duration_days?: number
          fact_checked?: boolean
          highlights?: string[]
          highlights_vi?: string[]
          id?: string
          includes_media?: boolean
          includes_tips?: boolean
          includes_transport?: boolean
          price?: number
          province?: string
          provinces?: string[]
          purchase_count?: number
          rating?: number
          review_count?: number
          status?: Database["public"]["Enums"]["plan_status"]
          tags?: string[]
          title?: string
          title_vi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          avatar_url: string | null
          bio: string | null
          id: string
          joined_at: string
          name: string
          province: string | null
          rating: number
          review_count: number
          total_plans: number
          total_sales: number
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          id: string
          joined_at?: string
          name: string
          province?: string | null
          rating?: number
          review_count?: number
          total_plans?: number
          total_sales?: number
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          id?: string
          joined_at?: string
          name?: string
          province?: string | null
          rating?: number
          review_count?: number
          total_plans?: number
          total_sales?: number
          verified?: boolean
        }
        Relationships: []
      }
      purchased_plan: {
        Row: {
          ai_tier: Database["public"]["Enums"]["ai_tier"] | null
          id: string
          notes: string | null
          plan_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          ai_tier?: Database["public"]["Enums"]["ai_tier"] | null
          id?: string
          notes?: string | null
          plan_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          ai_tier?: Database["public"]["Enums"]["ai_tier"] | null
          id?: string
          notes?: string | null
          plan_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchased_plan_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchased_plan_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      review: {
        Row: {
          comment: string | null
          comment_vi: string | null
          created_at: string
          helpful_count: number
          id: string
          plan_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          comment_vi?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          plan_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          comment_vi?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          plan_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_ledger: {
        Row: {
          challenge_instance_id: string | null
          created_at: string
          exp_delta: number
          id: string
          points_delta: number
          reason: string | null
          user_id: string
        }
        Insert: {
          challenge_instance_id?: string | null
          created_at?: string
          exp_delta: number
          id?: string
          points_delta: number
          reason?: string | null
          user_id: string
        }
        Update: {
          challenge_instance_id?: string | null
          created_at?: string
          exp_delta?: number
          id?: string
          points_delta?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_ledger_challenge_instance_id_fkey"
            columns: ["challenge_instance_id"]
            isOneToOne: false
            referencedRelation: "challenge_instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      stop: {
        Row: {
          alert_id: string | null
          id: string
          notes: string | null
          place_id: string
          plan_id: string | null
          purchased_plan_id: string | null
          replaces_stop_id: string | null
          stop_order: number
          transport_mode: Database["public"]["Enums"]["transport_mode"]
          travel_time_min: number
        }
        Insert: {
          alert_id?: string | null
          id?: string
          notes?: string | null
          place_id: string
          plan_id?: string | null
          purchased_plan_id?: string | null
          replaces_stop_id?: string | null
          stop_order: number
          transport_mode?: Database["public"]["Enums"]["transport_mode"]
          travel_time_min?: number
        }
        Update: {
          alert_id?: string | null
          id?: string
          notes?: string | null
          place_id?: string
          plan_id?: string | null
          purchased_plan_id?: string | null
          replaces_stop_id?: string | null
          stop_order?: number
          transport_mode?: Database["public"]["Enums"]["transport_mode"]
          travel_time_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "stop_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "weather_alert"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stop_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stop_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stop_purchased_plan_id_fkey"
            columns: ["purchased_plan_id"]
            isOneToOne: false
            referencedRelation: "purchased_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stop_replaces_stop_id_fkey"
            columns: ["replaces_stop_id"]
            isOneToOne: false
            referencedRelation: "stop"
            referencedColumns: ["id"]
          },
        ]
      }
      stop_challenge: {
        Row: {
          active: boolean
          challenge_order: number
          created_at: string
          description: string | null
          exp_reward: number
          id: string
          plan_stop_id: string
          points_reward: number
          title: string
        }
        Insert: {
          active?: boolean
          challenge_order?: number
          created_at?: string
          description?: string | null
          exp_reward?: number
          id?: string
          plan_stop_id: string
          points_reward?: number
          title: string
        }
        Update: {
          active?: boolean
          challenge_order?: number
          created_at?: string
          description?: string | null
          exp_reward?: number
          id?: string
          plan_stop_id?: string
          points_reward?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stop_challenge_plan_stop_id_fkey"
            columns: ["plan_stop_id"]
            isOneToOne: false
            referencedRelation: "stop"
            referencedColumns: ["id"]
          },
        ]
      }
      trip: {
        Row: {
          active_plan: Database["public"]["Enums"]["plan_variant"]
          created_at: string
          end_date: string | null
          id: string
          purchased_plan_id: string
          push_subscription: Json | null
          start_date: string
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active_plan?: Database["public"]["Enums"]["plan_variant"]
          created_at?: string
          end_date?: string | null
          id?: string
          purchased_plan_id: string
          push_subscription?: Json | null
          start_date: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active_plan?: Database["public"]["Enums"]["plan_variant"]
          created_at?: string
          end_date?: string | null
          id?: string
          purchased_plan_id?: string
          push_subscription?: Json | null
          start_date?: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_purchased_plan_id_fkey"
            columns: ["purchased_plan_id"]
            isOneToOne: false
            referencedRelation: "purchased_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          badge_tier_id: string | null
          created_at: string
          exp_total: number
          level: number
          points_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_tier_id?: string | null
          created_at?: string
          exp_total?: number
          level?: number
          points_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_tier_id?: string | null
          created_at?: string
          exp_total?: number
          level?: number
          points_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_badge_tier_id_fkey"
            columns: ["badge_tier_id"]
            isOneToOne: false
            referencedRelation: "badge_tier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher: {
        Row: {
          created_at: string
          description: string | null
          id: string
          place_id: string
          points_cost: number
          status: Database["public"]["Enums"]["voucher_status"]
          stock: number
          title: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          place_id: string
          points_cost: number
          status?: Database["public"]["Enums"]["voucher_status"]
          stock: number
          title: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          place_id?: string
          points_cost?: number
          status?: Database["public"]["Enums"]["voucher_status"]
          stock?: number
          title?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voucher_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_redemption: {
        Row: {
          created_at: string
          id: string
          points_spent: number
          redeemed_at: string | null
          status: Database["public"]["Enums"]["redemption_status"]
          user_id: string
          voucher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_spent: number
          redeemed_at?: string | null
          status?: Database["public"]["Enums"]["redemption_status"]
          user_id: string
          voucher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_spent?: number
          redeemed_at?: string | null
          status?: Database["public"]["Enums"]["redemption_status"]
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_redemption_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_redemption_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "voucher"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_alert: {
        Row: {
          affected_place_ids: string[]
          created_at: string
          id: string
          message: string
          message_vi: string | null
          plan_b_generated: boolean
          severity: Database["public"]["Enums"]["alert_severity"]
          trip_id: string
          type: Database["public"]["Enums"]["weather_type"]
          user_decision: Database["public"]["Enums"]["alert_decision"] | null
        }
        Insert: {
          affected_place_ids?: string[]
          created_at?: string
          id?: string
          message: string
          message_vi?: string | null
          plan_b_generated?: boolean
          severity: Database["public"]["Enums"]["alert_severity"]
          trip_id: string
          type: Database["public"]["Enums"]["weather_type"]
          user_decision?: Database["public"]["Enums"]["alert_decision"] | null
        }
        Update: {
          affected_place_ids?: string[]
          created_at?: string
          id?: string
          message?: string
          message_vi?: string | null
          plan_b_generated?: boolean
          severity?: Database["public"]["Enums"]["alert_severity"]
          trip_id?: string
          type?: Database["public"]["Enums"]["weather_type"]
          user_decision?: Database["public"]["Enums"]["alert_decision"] | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_alert_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      province_stats: {
        Row: {
          avg_credibility: number | null
          blog_hits: number | null
          facebook_hits: number | null
          google_maps_hits: number | null
          landmarks: number | null
          province: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_level: { Args: { exp_total: number }; Returns: number }
      purchase_plan_atomic: {
        Args: {
          p_ai_tier?: Database["public"]["Enums"]["ai_tier"]
          p_plan_id: string
          p_user_id: string
        }
        Returns: string
      }
      recalculate_plan_rating: {
        Args: { p_plan_id: string }
        Returns: undefined
      }
    }
    Enums: {
      ai_tier: "per-plan" | "monthly"
      alert_decision: "accepted" | "rejected"
      alert_severity: "low" | "medium" | "high"
      challenge_status: "pending" | "completed" | "failed"
      chat_role: "user" | "assistant" | "tool"
      place_category:
        | "temple"
        | "nature"
        | "beach"
        | "museum"
        | "food"
        | "market"
        | "cave"
      place_source_type: "google_places" | "facebook" | "blog" | "tripadvisor"
      plan_category:
        | "cultural"
        | "nature"
        | "food"
        | "adventure"
        | "beach"
        | "city"
      plan_difficulty: "easy" | "moderate" | "challenging"
      plan_status: "draft" | "published" | "archived"
      plan_variant: "a" | "b"
      redemption_status: "reserved" | "redeemed" | "cancelled"
      subscription_status: "active" | "cancelled" | "expired"
      transport_mode: "walk" | "taxi" | "motorbike" | "bus"
      trip_status: "active" | "completed" | "cancelled"
      voucher_status: "active" | "paused" | "expired"
      weather_type: "rain" | "storm" | "clear"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_tier: ["per-plan", "monthly"],
      alert_decision: ["accepted", "rejected"],
      alert_severity: ["low", "medium", "high"],
      challenge_status: ["pending", "completed", "failed"],
      chat_role: ["user", "assistant", "tool"],
      place_category: [
        "temple",
        "nature",
        "beach",
        "museum",
        "food",
        "market",
        "cave",
      ],
      place_source_type: ["google_places", "facebook", "blog", "tripadvisor"],
      plan_category: [
        "cultural",
        "nature",
        "food",
        "adventure",
        "beach",
        "city",
      ],
      plan_difficulty: ["easy", "moderate", "challenging"],
      plan_status: ["draft", "published", "archived"],
      plan_variant: ["a", "b"],
      redemption_status: ["reserved", "redeemed", "cancelled"],
      subscription_status: ["active", "cancelled", "expired"],
      transport_mode: ["walk", "taxi", "motorbike", "bus"],
      trip_status: ["active", "completed", "cancelled"],
      voucher_status: ["active", "paused", "expired"],
      weather_type: ["rain", "storm", "clear"],
    },
  },
} as const
