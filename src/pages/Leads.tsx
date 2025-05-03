
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLeads, addLead, updateLead, deleteLead, getCampaigns } from '@/services/dataService';
import { Lead, Campaign } from '@/types';
import { formatDate, formatPhoneNumber } from '@/lib/utils';
import { Plus, Trash2, Edit, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";

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
    notes: ''
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

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(searchLower) ||
      lead.phone.toLowerCase().includes(searchLower) ||
      lead.campaign.toLowerCase().includes(searchLower) ||
      lead.status.toLowerCase().includes(searchLower)
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLead({ ...currentLead, [name]: value });
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
      notes: ''
    });
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (lead: Lead) => {
    setCurrentLead({ ...lead });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleSaveLead = async () => {
    try {
      // Validate required fields
      if (!currentLead.name || !currentLead.phone || !currentLead.campaign || !currentLead.status) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (dialogMode === 'add') {
        const newLead = await addLead(currentLead as Omit<Lead, 'id' | 'createdAt'>);
        setLeads([newLead, ...leads]);
        toast.success('Lead adicionado com sucesso');
      } else {
        if (!currentLead.id) return;
        const updatedLead = await updateLead(currentLead.id, currentLead);
        setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
        toast.success('Lead atualizado com sucesso');
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Leads</h1>
            <p className="text-muted-foreground">Gerencie todos os seus leads de WhatsApp</p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Novo Lead
          </Button>
        </div>

        <div className="flex items-center">
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
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
                    <th className="p-4 text-left font-medium">Data</th>
                    <th className="p-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center">
                        Carregando leads...
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center">
                        Nenhum lead encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-b">
                        <td className="p-4">{lead.name}</td>
                        <td className="p-4">{lead.phone}</td>
                        <td className="p-4">{lead.campaign}</td>
                        <td className="p-4">{getStatusBadge(lead.status)}</td>
                        <td className="p-4">{formatDate(lead.createdAt)}</td>
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
                <Input
                  id="phone"
                  name="phone"
                  value={currentLead.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setCurrentLead({ ...currentLead, phone: formatted });
                  }}
                  placeholder="(00) 00000-0000"
                />
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
                    <SelectItem value="contacted">Contactado</SelectItem>
                    <SelectItem value="qualified">Qualificado</SelectItem>
                    <SelectItem value="converted">Convertido</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
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
