export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          active: boolean | null
          advanced_matching_enabled: boolean | null
          cancellation_keywords: string[] | null
          click_id: string | null
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
          click_id?: string | null
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
          click_id?: string | null
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
          ctwa_clid: string | null
          device_model: string | null
          device_type: string | null
          facebook_ad_id: string | null
          facebook_adset_id: string | null
          facebook_campaign_id: string | null
          id: string
          ip_address: string | null
          language: string | null
          location: string | null
          media_url: string | null
          os: string | null
          phone: string
          referrer: string | null
          screen_resolution: string | null
          source_id: string | null
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
          ctwa_clid?: string | null
          device_model?: string | null
          device_type?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          location?: string | null
          media_url?: string | null
          os?: string | null
          phone: string
          referrer?: string | null
          screen_resolution?: string | null
          source_id?: string | null
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
          ctwa_clid?: string | null
          device_model?: string | null
          device_type?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          location?: string | null
          media_url?: string | null
          os?: string | null
          phone?: string
          referrer?: string | null
          screen_resolution?: string | null
          source_id?: string | null
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
      facebook_mappings: {
        Row: {
          ad_name: string | null
          adset_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          created_at: string | null
          id: number
          source_id: string
          updated_at: string | null
        }
        Insert: {
          ad_name?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string | null
          id?: never
          source_id: string
          updated_at?: string | null
        }
        Update: {
          ad_name?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string | null
          id?: never
          source_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      global_keywords_settings: {
        Row: {
          cancellation_keywords: string[]
          conversion_keywords: string[]
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellation_keywords?: string[]
          conversion_keywords?: string[]
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          cancellation_keywords?: string[]
          conversion_keywords?: string[]
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
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
          confidence_score: number | null
          country: string | null
          created_at: string | null
          ctwa_clid: string | null
          custom_fields: Json | null
          data_sources: string[] | null
          device_model: string | null
          device_type: string | null
          facebook_ad_id: string | null
          facebook_adset_id: string | null
          facebook_campaign_id: string | null
          first_contact_date: string | null
          id: string
          initial_message: string | null
          ip_address: string | null
          landing_page: string | null
          language: string | null
          last_contact_date: string | null
          last_message: string | null
          last_whatsapp_attempt: string | null
          location: string | null
          media_url: string | null
          name: string
          notes: string | null
          os: string | null
          phone: string
          project_id: string | null
          referrer: string | null
          screen_resolution: string | null
          source_id: string | null
          status: string | null
          timezone: string | null
          tracking_method: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_session_id: string | null
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
          confidence_score?: number | null
          country?: string | null
          created_at?: string | null
          ctwa_clid?: string | null
          custom_fields?: Json | null
          data_sources?: string[] | null
          device_model?: string | null
          device_type?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          first_contact_date?: string | null
          id?: string
          initial_message?: string | null
          ip_address?: string | null
          landing_page?: string | null
          language?: string | null
          last_contact_date?: string | null
          last_message?: string | null
          last_whatsapp_attempt?: string | null
          location?: string | null
          media_url?: string | null
          name: string
          notes?: string | null
          os?: string | null
          phone: string
          project_id?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          source_id?: string | null
          status?: string | null
          timezone?: string | null
          tracking_method?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_session_id?: string | null
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
          confidence_score?: number | null
          country?: string | null
          created_at?: string | null
          ctwa_clid?: string | null
          custom_fields?: Json | null
          data_sources?: string[] | null
          device_model?: string | null
          device_type?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          first_contact_date?: string | null
          id?: string
          initial_message?: string | null
          ip_address?: string | null
          landing_page?: string | null
          language?: string | null
          last_contact_date?: string | null
          last_message?: string | null
          last_whatsapp_attempt?: string | null
          location?: string | null
          media_url?: string | null
          name?: string
          notes?: string | null
          os?: string | null
          phone?: string
          project_id?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          source_id?: string | null
          status?: string | null
          timezone?: string | null
          tracking_method?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_session_id?: string | null
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
      rate_limit_tracking: {
        Row: {
          blocked_until: string | null
          created_at: string | null
          id: string
          identifier: string
          request_count: number | null
          updated_at: string | null
          violations_count: number | null
          window_start: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          request_count?: number | null
          updated_at?: string | null
          violations_count?: number | null
          window_start?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          request_count?: number | null
          updated_at?: string | null
          violations_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          blocked_until: string | null
          created_at: string | null
          id: string
          identifier: string
          requests_count: number | null
          updated_at: string | null
          violations_count: number | null
          window_start: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          requests_count?: number | null
          updated_at?: string | null
          violations_count?: number | null
          window_start?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          requests_count?: number | null
          updated_at?: string | null
          violations_count?: number | null
          window_start?: string | null
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
      security_audit_logs: {
        Row: {
          created_at: string
          event_details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tracking_sessions: {
        Row: {
          browser_fingerprint: string | null
          campaign_id: string | null
          click_id: string | null
          created_at: string
          ctwa_clid: string | null
          current_url: string | null
          id: string
          ip_address: string | null
          language: string | null
          media_url: string | null
          referrer: string | null
          screen_resolution: string | null
          session_id: string
          source_id: string | null
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
          click_id?: string | null
          created_at?: string
          ctwa_clid?: string | null
          current_url?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          media_url?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          session_id: string
          source_id?: string | null
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
          click_id?: string | null
          created_at?: string
          ctwa_clid?: string | null
          current_url?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          media_url?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          session_id?: string
          source_id?: string | null
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
      utm_sessions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string | null
          landing_page: string | null
          matched_lead_id: string | null
          phone: string | null
          referrer: string | null
          session_id: string
          status: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          matched_lead_id?: string | null
          phone?: string | null
          referrer?: string | null
          session_id: string
          status?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          matched_lead_id?: string | null
          phone?: string | null
          referrer?: string | null
          session_id?: string
          status?: string | null
          updated_at?: string
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
      apply_global_keywords_to_campaign: {
        Args: { campaign_id_param: string }
        Returns: undefined
      }
      check_rate_limit_db: {
        Args: {
          identifier_param: string
          max_requests?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_utm_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_default_project_settings: {
        Args: { project_id_param: string }
        Returns: undefined
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string; key_name?: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { data: string; key_name?: string }
        Returns: string
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
      get_user_by_instance: {
        Args: { instance_name_param: string }
        Returns: string
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
      log_security_event: {
        Args: {
          event_type_param: string
          severity_param: string
          user_id_param?: string
          ip_address_param?: unknown
          user_agent_param?: string
          event_details_param?: Json
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
      validate_evolution_webhook: {
        Args: { instance_name_param: string; api_key_param: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
