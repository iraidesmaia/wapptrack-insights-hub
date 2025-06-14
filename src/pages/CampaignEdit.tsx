
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';
import CampaignKeywordsSettings from '@/components/campaigns/CampaignKeywordsSettings';
import { useCampaignKeywords } from '@/hooks/useCampaignKeywords';
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/types';

const CampaignEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  
  const {
    keywords,
    loading: keywordsLoading,
    saveKeywords,
    setConversionKeywords,
    setCancellationKeywords
  } = useCampaignKeywords(id || '');

  useEffect(() => {
    if (id) {
      loadCampaign();
    }
  }, [id]);

  const loadCampaign = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (error: any) {
      console.error('Error loading campaign:', error);
      toast.error('Erro ao carregar campanha');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!campaign || !id) return;

    try {
      setLoading(true);
      
      // Save campaign basic info
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({
          name: campaign.name,
          utm_source: campaign.utm_source,
          utm_medium: campaign.utm_medium,
          utm_campaign: campaign.utm_campaign,
          utm_content: campaign.utm_content,
          utm_term: campaign.utm_term,
          pixel_id: campaign.pixel_id,
          whatsapp_number: campaign.whatsapp_number,
          custom_message: campaign.custom_message,
          company_title: campaign.company_title,
          company_subtitle: campaign.company_subtitle,
          logo_url: campaign.logo_url,
          active: campaign.active
        })
        .eq('id', id);

      if (campaignError) throw campaignError;

      // Save keywords
      await saveKeywords(keywords);
      
      toast.success('Campanha salva com sucesso!');
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      toast.error('Erro ao salvar campanha');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !campaign) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando campanha...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!campaign) {
    return (
      <MainLayout>
        <div className="text-center">
          <p className="text-muted-foreground">Campanha não encontrada</p>
          <Button onClick={() => navigate('/campaigns')} className="mt-4">
            Voltar para Campanhas
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/campaigns')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Editar Campanha</h1>
              <p className="text-muted-foreground">{campaign.name}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading || keywordsLoading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
            <TabsTrigger value="utm">UTM Parameters</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Campanha</Label>
                  <Input
                    id="name"
                    value={campaign.name || ''}
                    onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                    placeholder="Nome da campanha"
                  />
                </div>
                
                <div>
                  <Label htmlFor="company_title">Título da Empresa</Label>
                  <Input
                    id="company_title"
                    value={campaign.company_title || ''}
                    onChange={(e) => setCampaign({ ...campaign, company_title: e.target.value })}
                    placeholder="Título da empresa"
                  />
                </div>

                <div>
                  <Label htmlFor="company_subtitle">Subtítulo da Empresa</Label>
                  <Input
                    id="company_subtitle"
                    value={campaign.company_subtitle || ''}
                    onChange={(e) => setCampaign({ ...campaign, company_subtitle: e.target.value })}
                    placeholder="Subtítulo da empresa"
                  />
                </div>

                <div>
                  <Label htmlFor="custom_message">Mensagem Personalizada</Label>
                  <Textarea
                    id="custom_message"
                    value={campaign.custom_message || ''}
                    onChange={(e) => setCampaign({ ...campaign, custom_message: e.target.value })}
                    placeholder="Mensagem personalizada para esta campanha"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-6">
            <CampaignKeywordsSettings
              conversionKeywords={keywords.conversionKeywords}
              cancellationKeywords={keywords.cancellationKeywords}
              onConversionKeywordsChange={setConversionKeywords}
              onCancellationKeywordsChange={setCancellationKeywords}
            />
          </TabsContent>

          <TabsContent value="utm" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parâmetros UTM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="utm_source">UTM Source</Label>
                  <Input
                    id="utm_source"
                    value={campaign.utm_source || ''}
                    onChange={(e) => setCampaign({ ...campaign, utm_source: e.target.value })}
                    placeholder="Ex: facebook, google"
                  />
                </div>

                <div>
                  <Label htmlFor="utm_medium">UTM Medium</Label>
                  <Input
                    id="utm_medium"
                    value={campaign.utm_medium || ''}
                    onChange={(e) => setCampaign({ ...campaign, utm_medium: e.target.value })}
                    placeholder="Ex: cpc, social"
                  />
                </div>

                <div>
                  <Label htmlFor="utm_campaign">UTM Campaign</Label>
                  <Input
                    id="utm_campaign"
                    value={campaign.utm_campaign || ''}
                    onChange={(e) => setCampaign({ ...campaign, utm_campaign: e.target.value })}
                    placeholder="Nome da campanha"
                  />
                </div>

                <div>
                  <Label htmlFor="utm_content">UTM Content</Label>
                  <Input
                    id="utm_content"
                    value={campaign.utm_content || ''}
                    onChange={(e) => setCampaign({ ...campaign, utm_content: e.target.value })}
                    placeholder="Identificador do conteúdo"
                  />
                </div>

                <div>
                  <Label htmlFor="utm_term">UTM Term</Label>
                  <Input
                    id="utm_term"
                    value={campaign.utm_term || ''}
                    onChange={(e) => setCampaign({ ...campaign, utm_term: e.target.value })}
                    placeholder="Palavras-chave"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pixel_id">Facebook Pixel ID</Label>
                  <Input
                    id="pixel_id"
                    value={campaign.pixel_id || ''}
                    onChange={(e) => setCampaign({ ...campaign, pixel_id: e.target.value })}
                    placeholder="ID do pixel do Facebook"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
                  <Input
                    id="whatsapp_number"
                    value={campaign.whatsapp_number || ''}
                    onChange={(e) => setCampaign({ ...campaign, whatsapp_number: e.target.value })}
                    placeholder="Ex: 5511999999999"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CampaignEdit;
