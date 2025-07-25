
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CampaignKeywords {
  conversionKeywords: string[];
  cancellationKeywords: string[];
}

export const useCampaignKeywords = (campaignId: string) => {
  const [keywords, setKeywords] = useState<CampaignKeywords>({
    conversionKeywords: [],
    cancellationKeywords: []
  });
  const [loading, setLoading] = useState(false);

  const loadKeywords = async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('conversion_keywords, cancellation_keywords')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      setKeywords({
        conversionKeywords: data.conversion_keywords || [],
        cancellationKeywords: data.cancellation_keywords || []
      });
    } catch (error: any) {
      console.error('Error loading campaign keywords:', error);
      toast.error('Erro ao carregar palavras-chave da campanha');
    } finally {
      setLoading(false);
    }
  };

  const saveKeywords = async (newKeywords: CampaignKeywords) => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('campaigns')
        .update({
          conversion_keywords: newKeywords.conversionKeywords,
          cancellation_keywords: newKeywords.cancellationKeywords
        })
        .eq('id', campaignId);

      if (error) throw error;

      setKeywords(newKeywords);
      toast.success('Palavras-chave da campanha salvas com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error saving campaign keywords:', error);
      toast.error('Erro ao salvar palavras-chave da campanha');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const applyGlobalKeywords = async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      
      // Buscar configurações globais
      const { data: globalSettings, error: globalError } = await supabase
        .from('global_keywords_settings')
        .select('conversion_keywords, cancellation_keywords')
        .single();

      if (globalError && globalError.code !== 'PGRST116') {
        throw globalError;
      }

      if (globalSettings) {
        const globalKeywords = {
          conversionKeywords: globalSettings.conversion_keywords || [],
          cancellationKeywords: globalSettings.cancellation_keywords || []
        };

        const success = await saveKeywords(globalKeywords);
        if (success) {
          toast.success('Configurações globais aplicadas à campanha!');
        }
      } else {
        toast.warning('Nenhuma configuração global encontrada');
      }
    } catch (error: any) {
      console.error('Error applying global keywords:', error);
      toast.error('Erro ao aplicar configurações globais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeywords();
  }, [campaignId]);

  return {
    keywords,
    loading,
    saveKeywords,
    applyGlobalKeywords,
    setConversionKeywords: (keywords: string[]) => 
      setKeywords(prev => ({ ...prev, conversionKeywords: keywords })),
    setCancellationKeywords: (keywords: string[]) => 
      setKeywords(prev => ({ ...prev, cancellationKeywords: keywords }))
  };
};
