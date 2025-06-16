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
          auto_create_leads: boolean | null
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
          evolution_api_key: string | null
          evolution_base_url: string | null
          evolution_instance_name: string | null
          external_id: string | null
          facebook_access_token: string | null
          id: string
          logo_url: string | null
          name: string
          pixel_id: string | null
          pixel_integration_type: string | null
          redirect_type: string | null
          server_side_api_enabled: boolean | null
          test_event_code: string | null
          tracking_domain: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          webhook_callback_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean | null
          advanced_matching_enabled?: boolean | null
          auto_create_leads?: boolean | null
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
          evolution_api_key?: string | null
          evolution_base_url?: string | null
          evolution_instance_name?: string | null
          external_id?: string | null
          facebook_access_token?: string | null
          id?: string
          logo_url?: string | null
          name: string
          pixel_id?: string | null
          pixel_integration_type?: string | null
          redirect_type?: string | null
          server_side_api_enabled?: boolean | null
          test_event_code?: string | null
          tracking_domain?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_callback_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean | null
          advanced_matching_enabled?: boolean | null
          auto_create_leads?: boolean | null
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
          evolution_api_key?: string | null
          evolution_base_url?: string | null
          evolution_instance_name?: string | null
          external_id?: string | null
          facebook_access_token?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          pixel_id?: string | null
          pixel_integration_type?: string | null
          redirect_type?: string | null
          server_side_api_enabled?: boolean | null
          test_event_code?: string | null
          tracking_domain?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_callback_url?: string | null
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
          theme: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string
          company_subtitle?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          company_subtitle?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          theme?: string | null
          updated_at?: string
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
      form_submissions: {
        Row: {
          card_positions: Json | null
          communication: number | null
          created_at: string | null
          creativity: number | null
          email: string
          id: number
          interests: string | null
          name: string
          organization: number | null
          productivity: number | null
          teamwork: number | null
        }
        Insert: {
          card_positions?: Json | null
          communication?: number | null
          created_at?: string | null
          creativity?: number | null
          email: string
          id?: number
          interests?: string | null
          name: string
          organization?: number | null
          productivity?: number | null
          teamwork?: number | null
        }
        Update: {
          card_positions?: Json | null
          communication?: number | null
          created_at?: string | null
          creativity?: number | null
          email?: string
          id?: number
          interests?: string | null
          name?: string
          organization?: number | null
          productivity?: number | null
          teamwork?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          campaign: string
          campaign_id: string | null
          created_at: string | null
          custom_fields: Json | null
          evolution_message_id: string | null
          evolution_status: string | null
          first_contact_date: string | null
          id: string
          last_contact_date: string | null
          last_message: string | null
          last_whatsapp_attempt: string | null
          name: string
          notes: string | null
          phone: string
          status: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          whatsapp_delivery_attempts: number | null
        }
        Insert: {
          campaign: string
          campaign_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          evolution_message_id?: string | null
          evolution_status?: string | null
          first_contact_date?: string | null
          id?: string
          last_contact_date?: string | null
          last_message?: string | null
          last_whatsapp_attempt?: string | null
          name: string
          notes?: string | null
          phone: string
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp_delivery_attempts?: number | null
        }
        Update: {
          campaign?: string
          campaign_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          evolution_message_id?: string | null
          evolution_status?: string | null
          first_contact_date?: string | null
          id?: string
          last_contact_date?: string | null
          last_message?: string | null
          last_whatsapp_attempt?: string | null
          name?: string
          notes?: string | null
          phone?: string
          status?: string | null
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
      pending_leads: {
        Row: {
          campaign_id: string
          campaign_name: string | null
          created_at: string
          id: string
          name: string
          phone: string
          status: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          webhook_data: Json | null
          webhook_sent_at: string | null
        }
        Insert: {
          campaign_id: string
          campaign_name?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_data?: Json | null
          webhook_sent_at?: string | null
        }
        Update: {
          campaign_id?: string
          campaign_name?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_data?: Json | null
          webhook_sent_at?: string | null
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
      utm_clicks: {
        Row: {
          created_at: string
          id: string
          phone: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          phone: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
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
      [_ in never]: never
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
