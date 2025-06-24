
import { supabase } from '@/integrations/supabase/client';

export interface GlobalKeywordSettings {
  id?: string;
  user_id?: string;
  conversion_keywords: string[];
  cancellation_keywords: string[];
  created_at?: string;
  updated_at?: string;
}

export const getGlobalKeywordSettings = async (): Promise<GlobalKeywordSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('global_keywords_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching global keyword settings:', error);
    return null;
  }
};

export const saveGlobalKeywordSettings = async (settings: Omit<GlobalKeywordSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('global_keywords_settings')
      .upsert({
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving global keyword settings:', error);
    return false;
  }
};

export const applyGlobalKeywordsToCampaign = async (campaignId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('apply_global_keywords_to_campaign', {
      campaign_id_param: campaignId
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error applying global keywords to campaign:', error);
    return false;
  }
};

export const applyGlobalKeywordsToAllCampaigns = async (keywords: Pick<GlobalKeywordSettings, 'conversion_keywords' | 'cancellation_keywords'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('campaigns')
      .update({
        conversion_keywords: keywords.conversion_keywords,
        cancellation_keywords: keywords.cancellation_keywords
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error applying global keywords to all campaigns:', error);
    return false;
  }
};
