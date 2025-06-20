export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          active: boolean | null
          advanced_matching_enabled: boolean | null
          cancellation_keywords: string[] | null
          company_subtitle: string | null
          company_title: string | null
          conversion_api_enabled: boolean | null
          conversion_keywords: string[] | null
          created_at: string | null
          custom_audience_pixel_id: string | null
          custom_message: string | null
          data_processing_options: string[] | null
          data_processing_options_country: number | null
          data_processing_options_state: number | null
          event_type: string | null
          external_id: string | null
          facebook_access_token: string | null
          id: string
          logo_url: string | null
          name: string
          pixel_id: string | null
          pixel_integration_type: string | null
          project_id: string | null
          redirect_type: string | null
          server_side_api_enabled: boolean | null
          test_event_code: string | null
          tracking_domain: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean | null
          advanced_matching_enabled?: boolean | null
          cancellation_keywords?: string[] | null
          company_subtitle?: string | null
          company_title?: string | null
          conversion_api_enabled?: boolean | null
          conversion_keywords?: string[] | null
          created_at?: string | null
          custom_audience_pixel_id?: string | null
          custom_message?: string | null
          data_processing_options?: string[] | null
          data_processing_options_country?: number | null
          data_processing_options_state?: number | null
          event_type?: string | null
          external_id?: string | null
          facebook_access_token?: string | null
          id?: string
          logo_url?: string | null
          name: string
          pixel_id?: string | null
          pixel_integration_type?: string | null
          project_id?: string | null
          redirect_type?: string | null
          server_side_api_enabled?: boolean | null
          test_event_code?: string | null
          tracking_domain?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean | null
          advanced_matching_enabled?: boolean | null
          cancellation_keywords?: string[] | null
          company_subtitle?: string | null
          company_title?: string | null
          conversion_api_enabled?: boolean | null
          conversion_keywords?: string[] | null
          created_at?: string | null
          custom_audience_pixel_id?: string | null
          custom_message?: string | null
          data_processing_options?: string[] | null
          data_processing_options_country?: number | null
          data_processing_options_state?: number | null
          event_type?: string | null
          external_id?: string | null
          facebook_access_token?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          pixel_id?: string | null
          pixel_integration_type?: string | null
          project_id?: string | null
          redirect_type?: string | null
          server_side_api_enabled?: boolean | null
          test_event_code?: string | null
          tracking_domain?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_name: string
          company_subtitle: string
          created_at: string
          id: string
          logo_url: string | null
          project_id: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string
          company_subtitle?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          project_id?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          company_name?: string
          company_subtitle?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          project_id?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_data: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_model: string | null
          device_type: string | null
          facebook_ad_id: string | null
          facebook_adset_id: string | null
          facebook_campaign_id: string | null
          id: string
          ip_address: string | null
          language: string | null
          location: string | null
          os: string | null
          phone: string
          referrer: string | null
          screen_resolution: string | null
          timezone: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_model?: string | null
          device_type?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          location?: string | null
          os?: string | null
          phone: string
          referrer?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_model?: string | null
          device_type?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          location?: string | null
          os?: string | null
          phone?: string
          referrer?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          ad_account: string | null
          ad_name: string | null
          ad_set_name: string | null
          browser: string | null
          campaign: string
          campaign_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          custom_fields: Json | null
          device_model: string | null
          device_type: string | null
          facebook_ad_id: string | null
          facebook_adset_id: string | null
          facebook_campaign_id: string | null
          first_contact_date: string | null
          id: string
          initial_message: string | null
          ip_address: string | null
          language: string | null
          last_contact_date: string | null
          last_message: string | null
          last_whatsapp_attempt: string | null
          location: string | null
          name: string
          notes: string | null
          os: string | null
          phone: string
          project_id: string | null
          screen_resolution: string | null
          status: string | null
          timezone: string | null
          tracking_method: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          whatsapp_delivery_attempts: number | null
        }
        Insert: {
          ad_account?: string | null
          ad_name?: string | null
          ad_set_name?: string | null
          browser?: string | null
          campaign: string
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          device_model?: string | null
          device_type?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          first_contact_date?: string | null
          id?: string
          initial_message?: string | null
          ip_address?: string | null
          language?: string | null
          last_contact_date?: string | null
          last_message?: string | null
          last_whatsapp_attempt?: string | null
          location?: string | null
          name: string
          notes?: string | null
          os?: string | null
          phone: string
          project_id?: string | null
          screen_resolution?: string | null
          status?: string | null
          timezone?: string | null
          tracking_method?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp_delivery_attempts?: number | null
        }
        Update: {
          ad_account?: string | null
          ad_name?: string | null
          ad_set_name?: string | null
          browser?: string | null
          campaign?: string
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          device_model?: string | null
          device_type?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          first_contact_date?: string | null
          id?: string
          initial_message?: string | null
          ip_address?: string | null
          language?: string | null
          last_contact_date?: string | null
          last_message?: string | null
          last_whatsapp_attempt?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          os?: string | null
          phone?: string
          project_id?: string | null
          screen_resolution?: string | null
          status?: string | null
          timezone?: string | null
          tracking_method?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp_delivery_attempts?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          campaign: string
          date: string | null
          id: string
          lead_id: string | null
          lead_name: string
          notes: string | null
          product: string | null
          project_id: string | null
          user_id: string
          value: number
        }
        Insert: {
          campaign: string
          date?: string | null
          id?: string
          lead_id?: string | null
          lead_name: string
          notes?: string | null
          product?: string | null
          project_id?: string | null
          user_id?: string
          value: number
        }
        Update: {
          campaign?: string
          date?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string
          notes?: string | null
          product?: string | null
          project_id?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_sessions: {
        Row: {
          browser_fingerprint: string | null
          campaign_id: string | null
          created_at: string
          current_url: string | null
          id: string
          ip_address: string | null
          language: string | null
          referrer: string | null
          screen_resolution: string | null
          session_id: string
          timezone: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser_fingerprint?: string | null
          campaign_id?: string | null
          created_at?: string
          current_url?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          session_id: string
          timezone?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser_fingerprint?: string | null
          campaign_id?: string | null
          created_at?: string
          current_url?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          session_id?: string
          timezone?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_project_settings: {
        Args: { project_id_param: string }
        Returns: undefined
      }
      get_tracking_by_identifiers: {
        Args: {
          p_browser_fingerprint?: string
          p_session_id?: string
          p_ip_address?: string
        }
        Returns: {
          id: string
          session_id: string
          browser_fingerprint: string
          ip_address: string
          user_agent: string
          campaign_id: string
          utm_source: string
          utm_medium: string
          utm_campaign: string
          utm_content: string
          utm_term: string
          created_at: string
        }[]
      }
      insert_tracking_session: {
        Args: {
          session_id: string
          browser_fingerprint?: string
          ip_address?: string
          user_agent?: string
          screen_resolution?: string
          language?: string
          timezone?: string
          referrer?: string
          current_url?: string
          campaign_id?: string
          utm_source?: string
          utm_medium?: string
          utm_campaign?: string
          utm_content?: string
          utm_term?: string
        }
        Returns: undefined
      }
      select_from_tracking_sessions: {
        Args: { where_clause?: string; order_by?: string; limit_count?: number }
        Returns: {
          id: string
          session_id: string
          browser_fingerprint: string
          ip_address: string
          user_agent: string
          campaign_id: string
          utm_source: string
          utm_medium: string
          utm_campaign: string
          utm_content: string
          utm_term: string
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
