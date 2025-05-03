
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSales, addSale, updateSale, deleteSale, getLeads, getCampaigns } from '@/services/dataService';
import { Sale, Lead, Campaign } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentSale, setCurrentSale] = useState<Partial<Sale>>({
    value: 0,
    date: new Date().toISOString().split('T')[0],
    leadId: '',
    leadName: '',
    campaign: '',
    product: '',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [salesData, leadsData, campaignsData] = await Promise.all([
          getSales(),
          getLeads(),
          getCampaigns()
        ]);
        setSales(salesData);
        setLeads(leadsData);
        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        toast.error('Erro ao carregar vendas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSales = sales.filter((sale) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.leadName.toLowerCase().includes(searchLower) ||
      sale.campaign.toLowerCase().includes(searchLower) ||
      (sale.product && sale.product.toLowerCase().includes(searchLower)) ||
      formatCurrency(sale.value).includes(searchLower)
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'value') {
      // Handle numeric input
      const numericValue = parseFloat(value);
      setCurrentSale({ ...currentSale, [name]: isNaN(numericValue) ? 0 : numericValue });
    } else {
      setCurrentSale({ ...currentSale, [name]: value });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'leadId') {
      const selectedLead = leads.find(lead => lead.id === value);
      setCurrentSale({ 
        ...currentSale, 
        [name]: value,
        leadName: selectedLead?.name || '',
        campaign: selectedLead?.campaign || currentSale.campaign || ''
      });
    } else {
      setCurrentSale({ ...currentSale, [name]: value });
    }
  };

  const handleOpenAddDialog = () => {
    setCurrentSale({
      value: 0,
      date: new Date().toISOString().split('T')[0],
      leadId: '',
      leadName: '',
      campaign: '',
      product: '',
      notes: ''
    });
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (sale: Sale) => {
    // Format the date to YYYY-MM-DD for the input field
    const formattedDate = new Date(sale.date).toISOString().split('T')[0];
    
    setCurrentSale({ 
      ...sale,
      date: formattedDate 
    });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleSaveSale = async () => {
    try {
      // Validate required fields
      if (!currentSale.value || !currentSale.date || !currentSale.leadId || !currentSale.campaign) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      // Ensure value is a number
      const saleValue = typeof currentSale.value === 'string' 
        ? parseFloat(currentSale.value) 
        : currentSale.value;

      if (dialogMode === 'add') {
        const newSale = await addSale({
          ...currentSale,
          value: saleValue,
          date: new Date(currentSale.date as string).toISOString(),
        } as Omit<Sale, 'id'>);
        
        setSales([...sales, newSale]);
        toast.success('Venda adicionada com sucesso');
      } else {
        if (!currentSale.id) return;
        
        const updatedSale = await updateSale(currentSale.id, {
          ...currentSale,
          value: saleValue,
          date: new Date(currentSale.date as string).toISOString(),
        });
        
        setSales(sales.map(sale => sale.id === updatedSale.id ? updatedSale : sale));
        toast.success('Venda atualizada com sucesso');
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error('Erro ao salvar venda');
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta venda?')) {
      return;
    }

    try {
      await deleteSale(id);
      setSales(sales.filter(sale => sale.id !== id));
      toast.success('Venda excluída com sucesso');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Erro ao excluir venda');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Vendas</h1>
            <p className="text-muted-foreground">Gerencie as vendas realizadas para seus leads</p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Nova Venda
          </Button>
        </div>

        <div className="flex items-center">
          <Input
            placeholder="Buscar vendas..."
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
                    <th className="p-4 text-left font-medium">Cliente</th>
                    <th className="p-4 text-right font-medium">Valor</th>
                    <th className="p-4 text-left font-medium">Campanha</th>
                    <th className="p-4 text-left font-medium">Produto</th>
                    <th className="p-4 text-left font-medium">Data</th>
                    <th className="p-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center">
                        Carregando vendas...
                      </td>
                    </tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center">
                        Nenhuma venda encontrada
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-b">
                        <td className="p-4">{sale.leadName}</td>
                        <td className="p-4 text-right font-medium">{formatCurrency(sale.value)}</td>
                        <td className="p-4">{sale.campaign}</td>
                        <td className="p-4">{sale.product || '-'}</td>
                        <td className="p-4">{formatDate(sale.date)}</td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(sale)}
                            title="Editar venda"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSale(sale.id)}
                            title="Excluir venda"
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
                {dialogMode === 'add' ? 'Adicionar Nova Venda' : 'Editar Venda'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'add' 
                  ? 'Preencha os detalhes para registrar uma nova venda.' 
                  : 'Atualize os detalhes da venda.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="value">Valor*</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentSale.value}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Data*</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={currentSale.date as string}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="leadId">Lead*</Label>
                <Select 
                  value={currentSale.leadId} 
                  onValueChange={(value) => handleSelectChange('leadId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign">Campanha*</Label>
                <Select 
                  value={currentSale.campaign} 
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
                <Label htmlFor="product">Produto</Label>
                <Input
                  id="product"
                  name="product"
                  value={currentSale.product || ''}
                  onChange={handleInputChange}
                  placeholder="Nome do produto vendido"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={currentSale.notes || ''}
                  onChange={handleInputChange}
                  placeholder="Observações sobre a venda"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSale}>
                {dialogMode === 'add' ? 'Adicionar' : 'Atualizar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Sales;
