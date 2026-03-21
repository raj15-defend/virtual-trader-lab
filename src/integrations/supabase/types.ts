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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_predictions: {
        Row: {
          confidence: number | null
          created_at: string
          expires_at: string
          id: string
          prediction_data: Json
          prediction_type: string
          recommendation: string | null
          stock_symbol: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          prediction_data?: Json
          prediction_type: string
          recommendation?: string | null
          stock_symbol: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          prediction_data?: Json
          prediction_type?: string
          recommendation?: string | null
          stock_symbol?: string
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          resolved: boolean
          severity: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          resolved?: boolean
          severity?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          resolved?: boolean
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          avg_buy_price: number
          created_at: string
          id: string
          quantity: number
          stock_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_buy_price?: number
          created_at?: string
          id?: string
          quantity?: number
          stock_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_buy_price?: number
          created_at?: string
          id?: string
          quantity?: number
          stock_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      market_news: {
        Row: {
          created_at: string
          id: string
          published_at: string
          sentiment: string | null
          source: string | null
          stock_symbol: string | null
          summary: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          published_at?: string
          sentiment?: string | null
          source?: string | null
          stock_symbol?: string | null
          summary?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          published_at?: string
          sentiment?: string | null
          source?: string | null
          stock_symbol?: string | null
          summary?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          phone_number: string | null
          status: string
          updated_at: string
          user_id: string
          username: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      stock_prices: {
        Row: {
          close_price: number
          high_price: number
          id: string
          low_price: number
          open_price: number
          stock_id: string
          timestamp: string
          volume: number
        }
        Insert: {
          close_price: number
          high_price: number
          id?: string
          low_price: number
          open_price: number
          stock_id: string
          timestamp?: string
          volume?: number
        }
        Update: {
          close_price?: number
          high_price?: number
          id?: string
          low_price?: number
          open_price?: number
          stock_id?: string
          timestamp?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_prices_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          created_at: string
          description: string | null
          dividend_yield: number | null
          eps: number | null
          fifty_two_week_high: number | null
          fifty_two_week_low: number | null
          id: string
          market_cap: number | null
          name: string
          pe_ratio: number | null
          sector: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dividend_yield?: number | null
          eps?: number | null
          fifty_two_week_high?: number | null
          fifty_two_week_low?: number | null
          id?: string
          market_cap?: number | null
          name: string
          pe_ratio?: number | null
          sector?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dividend_yield?: number | null
          eps?: number | null
          fifty_two_week_high?: number | null
          fifty_two_week_low?: number | null
          id?: string
          market_cap?: number | null
          name?: string
          pe_ratio?: number | null
          sector?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          created_at: string
          id: string
          price: number
          quantity: number
          stock_id: string
          total: number
          trade_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          quantity: number
          stock_id: string
          total: number
          trade_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          quantity?: number
          stock_id?: string
          total?: number
          trade_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          payment_method: string | null
          reference_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          stock_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stock_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stock_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          account_details: Json
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          withdrawal_method: string
        }
        Insert: {
          account_details?: Json
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          withdrawal_method: string
        }
        Update: {
          account_details?: Json
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          withdrawal_method?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
