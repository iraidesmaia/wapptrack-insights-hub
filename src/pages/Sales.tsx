
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSales, addSale, updateSale, deleteSale } from '@/services/dataService';
import { Sale } from '@/types';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { useProject } from '@/context/ProjectContext';

const Sales = () => {
  const { activeProject } = useProject();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    lead_name: '',
    campaign: '',
    value: '',
    product: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Sales - Buscando vendas para projeto:', activeProject?.id);
      
      // 🎯 Passar o ID do projeto ativo para filtrar vendas
      const salesData = await getSales(activeProject?.id);
      
      console.log('✅ Sales - Vendas carregadas:', {
        projectId: activeProject?.id,
        projectName: activeProject?.name,
        totalSales: salesData.length
      });
      
      setSales(salesData);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [activeProject?.id]); // 🎯 Recarregar quando o projeto ativo mudar

  const handleOpenDialog = (sale?: Sale) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        lead_name: sale.lead_name,
        campaign: sale.campaign,
        value: sale.value.toString(),
        product: sale.product || '',
        notes: sale.notes || '',
        date: sale.date ? new Date(sale.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingSale(null);
      setFormData({
        lead_name: '',
        campaign: '',
        value: '',
        product: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveSale = async () => {
    try {
      if (!formData.lead_name || !formData.campaign || !formData.value) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const saleData = {
        lead_name: formData.lead_name,
        campaign: formData.campaign,
        value: parseInt(formData.value),
        product: formData.product,
        notes: formData.notes,
        date: new Date(formData.date).toISOString()
      };

      console.log('💾 Sales - Salvando venda para projeto:', activeProject?.id);

      if (editingSale) {
        const updatedSale = await updateSale(editingSale.id, saleData);
        setSales(sales.map(s => s.id === updatedSale.id ? updatedSale : s));
        toast.success('Venda atualizada com sucesso');
      } else {
        // 🎯 Passar o ID do projeto ativo ao criar nova venda
        const newSale = await addSale(saleData, activeProject?.id);
        setSales([newSale, ...sales]);
        toast.success('Venda criada com sucesso');
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
      setSales(sales.filter(s => s.id !== id));
      toast.success('Venda excluída com sucesso');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Erro ao excluir venda');
    }
  };

  const filteredSales = sales.filter((sale) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.lead_name.toLowerCase().includes(searchLower) ||
      sale.campaign.toLowerCase().includes(searchLower) ||
      (sale.product && sale.product.toLowerCase().includes(searchLower))
    );
  });

  // Calculate statistics
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.value, 0);
  const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
  const thisMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    const now = new Date();
    return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthSales.reduce((sum, sale) => sum + sale.value, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Vendas</h1>
            <p className="text-muted-foreground">
              Gerencie suas vendas e faturamento
              {activeProject && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Projeto: {activeProject.name}
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nova Venda
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalRevenue.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {averageTicket.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas este Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisMonthSales.length}</div>
              <p className="text-xs text-muted-foreground">
                R$ {thisMonthRevenue.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sales.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center">
          <Input
            placeholder="Buscar vendas por lead, campanha ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-lg"
          />
        </div>

        {/* Sales Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando vendas...
                  </TableCell>
                </TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.lead_name}</TableCell>
                    <TableCell>{sale.campaign}</TableCell>
                    <TableCell>{sale.product || '-'}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      R$ {sale.value.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {sale.date ? format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(sale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSale(sale.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Sale Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSale ? 'Editar Venda' : 'Nova Venda'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lead_name" className="text-right">
                  Lead *
                </Label>
                <Input
                  id="lead_name"
                  value={formData.lead_name}
                  onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                  className="col-span-3"
                  placeholder="Nome do lead"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="campaign" className="text-right">
                  Campanha *
                </Label>
                <Input
                  id="campaign"
                  value={formData.campaign}
                  onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                  className="col-span-3"
                  placeholder="Nome da campanha"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">
                  Valor *
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="col-span-3"
                  placeholder="Valor da venda"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product" className="text-right">
                  Produto
                </Label>
                <Input
                  id="product"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="col-span-3"
                  placeholder="Nome do produto"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Data
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="col-span-3"
                  placeholder="Observações adicionais"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSale}>
                {editingSale ? 'Atualizar' : 'Criar'} Venda
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Sales;
