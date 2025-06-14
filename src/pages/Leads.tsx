import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLeads, addLead, updateLead, deleteLead, getCampaigns, addSale } from '@/services/dataService';
import { Lead, Campaign } from '@/types';
import { formatDate } from '@/lib/utils';
import { formatBrazilianPhone, processBrazilianPhone, validateBrazilianPhone, formatPhoneWithCountryCode } from '@/lib/phoneUtils';
import { Plus, Trash2, Edit, MessageSquare, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentLead, setCurrentLead] = useState<Partial<Lead>>({
    name: '',
    phone: '',
    campaign: '',
    status: 'new',
    notes: '',
    first_contact_date: '',
    last_contact_date: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [leadsData, campaignsData] = await Promise.all([
          getLeads(),
          getCampaigns()
        ]);
        setLeads(leadsData);
        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Error fetching leads data:', error);
        toast.error('Erro ao carregar leads');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fixPhoneNumbers = async () => {
    try {
      setIsLoading(true);
      
      // Buscar lead com número similar que está causando o problema
      const { data: problematicLead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('phone', '5585998732658')
        .single();

      if (problematicLead && !error) {
        // Atualizar para o número correto que vem do webhook
        const { error: updateError } = await supabase
          .from('leads')
          .update({ phone: '558598372658' })
          .eq('id', problematicLead.id);

        if (updateError) {
          console.error('Erro ao atualizar número:', updateError);
          toast.error('Erro ao corrigir número do telefone');
        } else {
          toast.success('Número de telefone corrigido com sucesso!');
          // Recarregar os dados
          const leadsData = await getLeads();
          setLeads(leadsData);
        }
      } else {
        toast.info('Nenhum número problemático encontrado');
      }
    } catch (error) {
      console.error('Error fixing phone numbers:', error);
      toast.error('Erro ao corrigir números');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(searchLower) ||
      lead.phone.toLowerCase().includes(searchLower) ||
      lead.campaign.toLowerCase().includes(searchLower) ||
      lead.status.toLowerCase().includes(searchLower) ||
      (lead.last_message && lead.last_message.toLowerCase().includes(searchLower))
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLead({ ...currentLead, [name]: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatBrazilianPhone(value);
    setCurrentLead({ ...currentLead, phone: formatted });
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentLead({ ...currentLead, [name]: value });
  };

  const handleOpenAddDialog = () => {
    setCurrentLead({
      name: '',
      phone: '',
      campaign: '',
      status: 'new',
      notes: '',
      first_contact_date: '',
      last_contact_date: ''
    });
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (lead: Lead) => {
    // Format existing phone for editing (remove country code for display)
    let displayPhone = lead.phone;
    if (lead.phone.startsWith('55')) {
      const phoneWithoutCountryCode = lead.phone.slice(2);
      displayPhone = formatBrazilianPhone(phoneWithoutCountryCode);
    }
    
    setCurrentLead({ ...lead, phone: displayPhone });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const createSaleFromLead = async (lead: Lead) => {
    try {
      const newSale = await addSale({
        value: 0,
        date: new Date().toISOString(),
        lead_id: lead.id,
        lead_name: lead.name,
        campaign: lead.campaign,
        product: '',
        notes: `Venda criada automaticamente quando lead foi convertido`
      });
      
      console.log('Venda criada automaticamente:', newSale);
      toast.success('Lead convertido! Uma nova venda foi criada automaticamente.');
    } catch (error) {
      console.error('Erro ao criar venda automática:', error);
      toast.error('Lead atualizado, mas houve erro ao criar a venda automática');
    }
  };

  const handleSaveLead = async () => {
    try {
      // Validate required fields
      if (!currentLead.name || !currentLead.phone || !currentLead.campaign || !currentLead.status) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      // Validate phone format
      if (!validateBrazilianPhone(currentLead.phone)) {
        toast.error('Por favor, informe um número válido (DDD + 8 ou 9 dígitos)');
        return;
      }

      let updatedLead: Lead;
      const wasConverted = currentLead.status === 'converted';

      // Process phone to add country code before saving
      const processedPhone = processBrazilianPhone(currentLead.phone);
      const leadToSave = { ...currentLead, phone: processedPhone };

      if (dialogMode === 'add') {
        const newLead = await addLead(leadToSave as Omit<Lead, 'id' | 'created_at'>);
        setLeads([newLead, ...leads]);
        updatedLead = newLead;
        toast.success('Lead adicionado com sucesso');
      } else {
        if (!currentLead.id) return;
        
        // Verificar se o status mudou para 'converted'
        const originalLead = leads.find(lead => lead.id === currentLead.id);
        const statusChangedToConverted = originalLead?.status !== 'converted' && currentLead.status === 'converted';
        
        updatedLead = await updateLead(currentLead.id, leadToSave);
        setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
        toast.success('Lead atualizado com sucesso');
        
        // Se o status mudou para convertido, criar uma venda automaticamente
        if (statusChangedToConverted) {
          await createSaleFromLead(updatedLead);
        }
      }

      // Se for um novo lead e já está marcado como convertido, criar venda também
      if (dialogMode === 'add' && wasConverted) {
        await createSaleFromLead(updatedLead);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Erro ao salvar lead');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este lead?')) {
      return;
    }

    try {
      await deleteLead(id);
      setLeads(leads.filter(lead => lead.id !== id));
      toast.success('Lead excluído com sucesso');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-blue-500">Novo</Badge>;
      case 'contacted':
        return <Badge variant="default" className="bg-yellow-500">Contactado</Badge>;
      case 'qualified':
        return <Badge variant="default" className="bg-accent">Qualificado</Badge>;
      case 'converted':
        return <Badge variant="default" className="bg-primary">Convertido</Badge>;
      case 'lost':
        return <Badge variant="destructive">Perdido</Badge>;
      case 'lead':
        return <Badge variant="default" className="bg-green-500">Lead</Badge>;
      case 'to_recover':
        return <Badge variant="default" className="bg-orange-500">A recuperar</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const truncateMessage = (message: string | undefined, maxLength: number = 50) => {
    if (!message) return '-';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Leads</h1>
            <p className="text-muted-foreground">Gerencie todos os seus leads de WhatsApp</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fixPhoneNumbers}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Corrigir Números
            </Button>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Novo Lead
            </Button>
          </div>
        </div>

        <div className="flex items-center">
          <Input
            placeholder="Buscar leads por nome, telefone, campanha, status ou mensagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-lg"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="table-wrapper overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-medium">Nome</th>
                    <th className="p-4 text-left font-medium">Telefone</th>
                    <th className="p-4 text-left font-medium">Campanha</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="p-4 text-left font-medium">Última Mensagem</th>
                    <th className="p-4 text-left font-medium">Data Criação</th>
                    <th className="p-4 text-left font-medium">Primeiro Contato</th>
                    <th className="p-4 text-left font-medium">Último Contato</th>
                    <th className="p-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-center">
                        Carregando leads...
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-center">
                        Nenhum lead encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-b">
                        <td className="p-4">{lead.name}</td>
                        <td className="p-4">{formatPhoneWithCountryCode(lead.phone)}</td>
                        <td className="p-4">{lead.campaign}</td>
                        <td className="p-4">{getStatusBadge(lead.status)}</td>
                        <td className="p-4" title={lead.last_message || ''}>
                          <span className="text-sm text-muted-foreground">
                            {truncateMessage(lead.last_message, 40)}
                          </span>
                        </td>
                        <td className="p-4">{formatDate(lead.created_at)}</td>
                        <td className="p-4">{lead.first_contact_date ? formatDate(lead.first_contact_date) : '-'}</td>
                        <td className="p-4">{lead.last_contact_date ? formatDate(lead.last_contact_date) : '-'}</td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openWhatsApp(lead.phone)}
                            title="Abrir WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(lead)}
                            title="Editar lead"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLead(lead.id)}
                            title="Excluir lead"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'add' ? 'Adicionar Novo Lead' : 'Editar Lead'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'add' 
                  ? 'Preencha os detalhes para adicionar um novo lead.' 
                  : 'Atualize os detalhes do lead.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentLead.name}
                  onChange={handleInputChange}
                  placeholder="Nome do lead"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                    +55
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    value={currentLead.phone}
                    onChange={handlePhoneChange}
                    placeholder="(85) 99999-9999 ou (85) 9999-9999"
                    className="pl-12"
                    maxLength={16}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite o DDD e número (8 ou 9 dígitos). Ex: 85998372658 ou 8598372658
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign">Campanha</Label>
                <Select 
                  value={currentLead.campaign} 
                  onValueChange={(value) => handleSelectChange('campaign', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.name}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={currentLead.status} 
                  onValueChange={(value) => handleSelectChange('status', value as Lead['status'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="to_recover">A recuperar</SelectItem>
                    <SelectItem value="contacted">Contactado</SelectItem>
                    <SelectItem value="qualified">Qualificado</SelectItem>
                    <SelectItem value="converted">Convertido</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {dialogMode === 'edit' && currentLead.last_message && (
                <div className="grid gap-2">
                  <Label htmlFor="last_message">Última Mensagem (Somente Leitura)</Label>
                  <Textarea
                    id="last_message"
                    value={currentLead.last_message}
                    readOnly
                    className="bg-muted/50 resize-none"
                    rows={2}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="first_contact_date">Data do Primeiro Contato</Label>
                <Input
                  id="first_contact_date"
                  name="first_contact_date"
                  type="datetime-local"
                  value={currentLead.first_contact_date ? new Date(currentLead.first_contact_date).toISOString().slice(0, 16) : ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_contact_date">Data do Último Contato</Label>
                <Input
                  id="last_contact_date"
                  name="last_contact_date"
                  type="datetime-local"
                  value={currentLead.last_contact_date ? new Date(currentLead.last_contact_date).toISOString().slice(0, 16) : ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={currentLead.notes || ''}
                  onChange={handleInputChange}
                  placeholder="Observações sobre o lead"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveLead}>
                {dialogMode === 'add' ? 'Adicionar' : 'Atualizar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Leads;
