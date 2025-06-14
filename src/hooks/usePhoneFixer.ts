
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getLeads } from '@/services/dataService';
import { toast } from "sonner";
import { Lead } from '@/types';

export const usePhoneFixer = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fixPhoneNumbers = async (): Promise<Lead[]> => {
    try {
      setIsLoading(true);
      
      console.log('Iniciando correção de números de telefone...');
      
      const { data: allLeads, error: fetchError } = await supabase
        .from('leads')
        .select('*');

      if (fetchError) {
        console.error('Erro ao buscar leads:', fetchError);
        toast.error('Erro ao buscar leads');
        throw fetchError;
      }

      console.log('Total de leads encontrados:', allLeads?.length);

      let correctedCount = 0;

      for (const lead of allLeads || []) {
        const originalPhone = lead.phone;
        let correctedPhone = originalPhone;

        if (originalPhone === '5585998732658') {
          correctedPhone = '558598372658';
          console.log(`Corrigindo número específico: ${originalPhone} -> ${correctedPhone}`);
        }
        else if (originalPhone.startsWith('55') && originalPhone.length === 13) {
          const withoutCountryCode = originalPhone.slice(2);
          if (withoutCountryCode.length === 11 && withoutCountryCode[2] === '9' && withoutCountryCode[3] === '9') {
            correctedPhone = '55' + withoutCountryCode.slice(0, 2) + withoutCountryCode.slice(3);
            console.log(`Removendo 9 duplicado: ${originalPhone} -> ${correctedPhone}`);
          }
        }

        if (correctedPhone !== originalPhone) {
          const { error: updateError } = await supabase
            .from('leads')
            .update({ phone: correctedPhone })
            .eq('id', lead.id);

          if (updateError) {
            console.error(`Erro ao atualizar lead ${lead.id}:`, updateError);
          } else {
            console.log(`Lead ${lead.name} (${lead.id}) atualizado: ${originalPhone} -> ${correctedPhone}`);
            correctedCount++;
          }
        }
      }

      if (correctedCount > 0) {
        toast.success(`${correctedCount} número(s) corrigido(s) com sucesso!`);
        const leadsData = await getLeads();
        console.log(`Processo de correção finalizado. ${correctedCount} números corrigidos.`);
        return leadsData;
      } else {
        toast.info('Nenhum número problemático encontrado para correção');
        // Transform the raw Supabase data to match Lead interface
        const transformedLeads: Lead[] = (allLeads || []).map(lead => ({
          id: lead.id,
          created_at: lead.created_at,
          name: lead.name,
          phone: lead.phone,
          campaign: lead.campaign,
          campaign_id: lead.campaign_id,
          status: lead.status as 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'lead' | 'to_recover',
          notes: lead.notes,
          first_contact_date: lead.first_contact_date,
          last_contact_date: lead.last_contact_date,
          custom_fields: lead.custom_fields,
          whatsapp_delivery_attempts: lead.whatsapp_delivery_attempts,
          last_whatsapp_attempt: lead.last_whatsapp_attempt,
          last_message: lead.last_message,
          evolution_message_id: lead.evolution_message_id,
          evolution_status: lead.evolution_status
        }));
        return transformedLeads;
      }

    } catch (error) {
      console.error('Error fixing phone numbers:', error);
      toast.error('Erro ao corrigir números');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { fixPhoneNumbers, isLoading };
};
