
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, BarChart3, Users, TrendingUp, Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/types';

const Campaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: 'Nova Campanha',
          active: true,
          auto_create_leads: true,
          redirect_type: 'form'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Campanha criada com sucesso!');
      navigate(`/campaigns/${data.id}/edit`);
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error('Erro ao criar campanha');
    }
  };

  const handleCopyLink = async (campaignId: string) => {
    const baseUrl = window.location.origin;
    const campaignUrl = `${baseUrl}/redirect?campaign=${campaignId}`;
    
    try {
      await navigator.clipboard.writeText(campaignUrl);
      toast.success('Link copiado!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Erro ao copiar link');
    }
  };

  const handleOpenPreview = (campaignId: string) => {
    const baseUrl = window.location.origin;
    const campaignUrl = `${baseUrl}/redirect?campaign=${campaignId}`;
    window.open(campaignUrl, '_blank');
  };

  const handleDirectWhatsApp = (whatsappNumber: string) => {
    if (!whatsappNumber) {
      toast.error('Número do WhatsApp não configurado');
      return;
    }
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando campanhas...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campanhas</h1>
            <p className="text-muted-foreground">
              Gerencie suas campanhas de marketing e acompanhe os resultados
            </p>
          </div>
          <Button onClick={handleCreateCampaign}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-muted-foreground text-center mb-6">
                Crie sua primeira campanha para começar a gerar leads
              </p>
              <Button onClick={handleCreateCampaign}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <div className="flex gap-1">
                      <Badge variant={campaign.active ? 'default' : 'secondary'}>
                        {campaign.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="outline">
                        {campaign.redirect_type === 'direct' ? 'Direto' : 'Formulário'}
                      </Badge>
                    </div>
                  </div>
                  {campaign.utm_source && (
                    <CardDescription>
                      {campaign.utm_source} • {campaign.utm_medium || 'N/A'}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>0 leads</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>R$ 0,00</span>
                    </div>
                  </div>
                  
                  {campaign.conversion_keywords && campaign.conversion_keywords.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {campaign.conversion_keywords.length} palavras-chave de conversão
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <strong>Link:</strong> /redirect?campaign={campaign.id}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyLink(campaign.id)}
                      title="Copiar link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenPreview(campaign.id)}
                      title="Abrir preview"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>

                    {campaign.redirect_type === 'direct' && campaign.whatsapp_number && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDirectWhatsApp(campaign.whatsapp_number)}
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Campaigns;
