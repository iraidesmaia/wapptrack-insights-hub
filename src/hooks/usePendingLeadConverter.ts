
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePendingLeadConverter = () => {
  const [isConverting, setIsConverting] = useState(false);

  const convertPendingLeads = async () => {
    try {
      setIsConverting(true);
      console.log('🔄 Iniciando conversão de pending_leads para leads...');

      // Buscar todos os pending_leads não convertidos
      const { data: pendingLeads, error: fetchError } = await supabase
        .from('pending_leads')
        .select('*')
        .eq('status', 'pending');

      if (fetchError) {
        console.error('❌ Erro ao buscar pending_leads:', fetchError);
        throw fetchError;
      }

      if (!pendingLeads || pendingLeads.length === 0) {
        toast.info('Nenhum pending_lead encontrado para conversão');
        return;
      }

      console.log(`📋 Encontrados ${pendingLeads.length} pending_leads para conversão`);
      let convertedCount = 0;
      let errorCount = 0;

      for (const pendingLead of pendingLeads) {
        try {
          console.log(`🔄 Convertendo pending_lead: ${pendingLead.name} (${pendingLead.phone})`);

          // Buscar user_id da campanha
          let campaignUserId = null;
          if (pendingLead.campaign_id) {
            const { data: campaign, error: campaignError } = await supabase
              .from('campaigns')
              .select('user_id')
              .eq('id', pendingLead.campaign_id)
              .single();

            if (campaign && !campaignError) {
              campaignUserId = campaign.user_id;
            }
          }

          // Verificar se já existe lead para este telefone
          const { data: existingLead } = await supabase
            .from('leads')
            .select('*')
            .eq('phone', pendingLead.phone)
            .limit(1);

          if (existingLead && existingLead.length > 0) {
            console.log(`⚠️ Lead já existe para ${pendingLead.phone}, marcando como convertido`);
            
            // Marcar como convertido mesmo que já exista
            await supabase
              .from('pending_leads')
              .update({ status: 'converted' })
              .eq('id', pendingLead.id);
            
            convertedCount++;
            continue;
          }

          // Buscar dados do dispositivo se disponível
          const { data: deviceData } = await supabase
            .from('device_data')
            .select('*')
            .eq('phone', pendingLead.phone)
            .order('created_at', { ascending: false })
            .limit(1);

          const device = deviceData?.[0];

          // Criar novo lead
          const newLeadData = {
            name: pendingLead.name,
            phone: pendingLead.phone,
            campaign: pendingLead.campaign_name || 'Formulário Direto',
            campaign_id: pendingLead.campaign_id,
            user_id: campaignUserId,
            status: 'new' as const,
            first_contact_date: new Date().toISOString(),
            notes: 'Lead criado via conversão automática de pending_lead',
            utm_source: pendingLead.utm_source,
            utm_medium: pendingLead.utm_medium,
            utm_campaign: pendingLead.utm_campaign,
            utm_content: pendingLead.utm_content,
            utm_term: pendingLead.utm_term,
            // Incluir dados do dispositivo se disponíveis
            location: device?.location || '',
            ip_address: device?.ip_address || '',
            browser: device?.browser || '',
            os: device?.os || '',
            device_type: device?.device_type || '',
            device_model: device?.device_model || '',
            country: device?.country || '',
            city: device?.city || '',
            screen_resolution: device?.screen_resolution || '',
            timezone: device?.timezone || '',
            language: device?.language || '',
            custom_fields: device ? { device_info: device } : null
          };

          const { error: insertError } = await supabase
            .from('leads')
            .insert(newLeadData);

          if (insertError) {
            console.error(`❌ Erro ao criar lead para ${pendingLead.name}:`, insertError);
            errorCount++;
            continue;
          }

          // Marcar pending_lead como convertido
          await supabase
            .from('pending_leads')
            .update({ status: 'converted' })
            .eq('id', pendingLead.id);

          console.log(`✅ Lead criado com sucesso para ${pendingLead.name}`);
          convertedCount++;

        } catch (error) {
          console.error(`❌ Erro ao processar pending_lead ${pendingLead.id}:`, error);
          errorCount++;
        }
      }

      if (convertedCount > 0) {
        toast.success(`${convertedCount} pending_leads convertidos para leads com sucesso!`);
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} pending_leads tiveram erro na conversão`);
      }

      console.log(`✅ Conversão finalizada: ${convertedCount} sucessos, ${errorCount} erros`);
      return { convertedCount, errorCount };

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
