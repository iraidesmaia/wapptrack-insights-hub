
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BatchConversionResult } from '@/types/supabase-functions';

export const usePendingLeadConverter = () => {
  const [isConverting, setIsConverting] = useState(false);

  const convertPendingLeads = async () => {
    try {
      setIsConverting(true);
      console.log('🔄 Iniciando conversão de pending_leads usando função Supabase...');

      // Usar a nova função Supabase para conversão em lote
      const { data: result, error } = await supabase.rpc('convert_all_pending_leads');

      if (error) {
        console.error('❌ Erro ao executar função de conversão:', error);
        throw error;
      }

      console.log('📋 Resultado da conversão:', result);

      const typedResult = result as unknown as BatchConversionResult;
      const { total_converted, total_errors, details } = typedResult;

      if (total_converted > 0) {
        toast.success(`${total_converted} pending_leads convertidos para leads com sucesso!`);
      }
      
      if (total_errors > 0) {
        toast.warning(`${total_errors} pending_leads tiveram erro na conversão`);
        console.error('❌ Detalhes dos erros:', details.filter((d: any) => !d.success));
      }

      if (total_converted === 0 && total_errors === 0) {
        toast.info('Nenhum pending_lead encontrado para conversão');
      }

      console.log(`✅ Conversão finalizada: ${total_converted} sucessos, ${total_errors} erros`);
      return { convertedCount: total_converted, errorCount: total_errors };

    } catch (error) {
      console.error('❌ Erro geral na conversão de pending_leads:', error);
      toast.error('Erro ao converter pending_leads');
      throw error;
    } finally {
      setIsConverting(false);
    }
  };

  return { convertPendingLeads, isConverting };
};
