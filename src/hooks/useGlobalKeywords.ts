
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GlobalKeywords {
  conversionKeywords: string[];
  cancellationKeywords: string[];
}

export const useGlobalKeywords = () => {
  const [keywords, setKeywords] = useState<GlobalKeywords>({
    conversionKeywords: [],
    cancellationKeywords: []
  });
  const [loading, setLoading] = useState(false);
  const [hasSettings, setHasSettings] = useState(false);

  const defaultConversionKeywords = [
    'obrigado pela compra',
    'obrigada pela compra', 
    'venda confirmada',
    'pedido aprovado',
    'parabéns pela aquisição',
    'compra realizada',
    'vendido',
    'venda fechada',
    'negócio fechado',
    'parabéns pela compra',
    'obrigado por comprar',
    'obrigada por comprar',
    'sua compra foi',
    'compra efetuada',
    'pedido confirmado'
  ];

  const defaultCancellationKeywords = [
    'compra cancelada',
    'pedido cancelado',
    'cancelamento',
    'desistiu da compra',
    'não quer mais',
    'mudou de ideia',
    'cancelar pedido',
    'estorno',
    'devolver',
    'não conseguiu pagar'
  ];

  const loadGlobalKeywords = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('global_keywords_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setKeywords({
          conversionKeywords: data.conversion_keywords || defaultConversionKeywords,
          cancellationKeywords: data.cancellation_keywords || defaultCancellationKeywords
        });
        setHasSettings(true);
      } else {
        // Não há configurações salvas, usar padrões
        setKeywords({
          conversionKeywords: defaultConversionKeywords,
          cancellationKeywords: defaultCancellationKeywords
        });
        setHasSettings(false);
      }
    } catch (error: any) {
      console.error('Error loading global keywords:', error);
      toast.error('Erro ao carregar configurações globais');
      
      // Fallback para padrões
      setKeywords({
        conversionKeywords: defaultConversionKeywords,
        cancellationKeywords: defaultCancellationKeywords
      });
      setHasSettings(false);
    } finally {
      setLoading(false);
    }
  };

  const saveGlobalKeywords = async (newKeywords: GlobalKeywords) => {
    try {
      setLoading(true);
      
      const upsertData = {
        conversion_keywords: newKeywords.conversionKeywords,
        cancellation_keywords: newKeywords.cancellationKeywords,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('global_keywords_settings')
        .upsert(upsertData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      setKeywords(newKeywords);
      setHasSettings(true);
      toast.success('Configurações globais salvas com sucesso!');
      
      return true;
    } catch (error: any) {
      console.error('Error saving global keywords:', error);
      toast.error('Erro ao salvar configurações globais');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const applyToAllCampaigns = async () => {
    try {
      setLoading(true);
      
      // Aplicar às campanhas existentes
      const { error } = await supabase
        .from('campaigns')
        .update({
          conversion_keywords: keywords.conversionKeywords,
          cancellation_keywords: keywords.cancellationKeywords
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Atualizar todas

      if (error) throw error;

      toast.success('Configurações aplicadas a todas as campanhas!');
      return true;
    } catch (error: any) {
      console.error('Error applying to campaigns:', error);
      toast.error('Erro ao aplicar às campanhas');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setKeywords({
      conversionKeywords: [...defaultConversionKeywords],
      cancellationKeywords: [...defaultCancellationKeywords]
    });
  };

  useEffect(() => {
    loadGlobalKeywords();
  }, []);

  return {
    keywords,
    loading,
    hasSettings,
    defaultConversionKeywords,
    defaultCancellationKeywords,
    setKeywords,
    saveGlobalKeywords,
    applyToAllCampaigns,
    resetToDefaults,
    loadGlobalKeywords
  };
};
