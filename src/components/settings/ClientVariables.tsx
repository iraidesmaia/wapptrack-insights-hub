
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Variable } from 'lucide-react';
import { toast } from 'sonner';
import { getClientVariables, addClientVariable, updateClientVariable, deleteClientVariable, type ClientVariable } from '@/services/clientVariableService';

interface ClientVariablesProps {
  clientId: string;
  clientName: string;
}

const ClientVariables = ({ clientId, clientName }: ClientVariablesProps) => {
  const [variables, setVariables] = useState<ClientVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<ClientVariable | null>(null);
  const [formData, setFormData] = useState({
    variable_name: '',
    variable_value: '',
    variable_type: 'text' as ClientVariable['variable_type'],
    description: ''
  });

  const loadVariables = async () => {
    try {
      setLoading(true);
      const data = await getClientVariables(clientId);
      setVariables(data);
    } catch (error) {
      console.error('Error loading variables:', error);
      toast.error('Erro ao carregar variáveis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadVariables();
    }
  }, [clientId]);

  const resetForm = () => {
    setFormData({
      variable_name: '',
      variable_value: '',
      variable_type: 'text',
      description: ''
    });
    setEditingVariable(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.variable_name.trim()) {
      toast.error('Nome da variável é obrigatório');
      return;
    }

    try {
      setLoading(true);
      
      if (editingVariable) {
        await updateClientVariable(editingVariable.id, formData);
        toast.success('Variável atualizada com sucesso!');
      } else {
        await addClientVariable({
          ...formData,
          client_id: clientId
        });
        toast.success('Variável criada com sucesso!');
      }
      
      resetForm();
      setIsDialogOpen(false);
      await loadVariables();
    } catch (error) {
      console.error('Error saving variable:', error);
      toast.error('Erro ao salvar variável');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (variable: ClientVariable) => {
    setEditingVariable(variable);
    setFormData({
      variable_name: variable.variable_name,
      variable_value: variable.variable_value,
      variable_type: variable.variable_type,
      description: variable.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (variable: ClientVariable) => {
    if (!confirm(`Tem certeza que deseja excluir a variável "${variable.variable_name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteClientVariable(variable.id);
      toast.success('Variável excluída com sucesso!');
      await loadVariables();
    } catch (error) {
      console.error('Error deleting variable:', error);
      toast.error('Erro ao excluir variável');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Variable className="w-5 h-5" />
          <span>Variáveis Personalizadas - {clientName}</span>
        </CardTitle>
        <CardDescription>
          Configure variáveis específicas para este cliente. Cada cliente possui suas próprias variáveis isoladas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {variables.length} variável(is) configurada(s)
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Nova Variável</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingVariable ? 'Editar Variável' : 'Nova Variável'}
                </DialogTitle>
                <DialogDescription>
                  Configure uma variável personalizada para {clientName}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="variable_name">Nome da Variável *</Label>
                  <Input
                    id="variable_name"
                    value={formData.variable_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, variable_name: e.target.value }))}
                    placeholder="ex: api_key, webhook_url, empresa_nome"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variable_type">Tipo da Variável</Label>
                  <Select 
                    value={formData.variable_type} 
                    onValueChange={(value: ClientVariable['variable_type']) => 
                      setFormData(prev => ({ ...prev, variable_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variable_value">Valor da Variável</Label>
                  <Input
                    id="variable_value"
                    value={formData.variable_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, variable_value: e.target.value }))}
                    placeholder="Digite o valor da variável"
                    type={formData.variable_type === 'number' ? 'number' : 
                          formData.variable_type === 'url' ? 'url' : 'text'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o propósito desta variável"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : editingVariable ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {variables.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variables.map((variable) => (
                <TableRow key={variable.id}>
                  <TableCell className="font-medium">{variable.variable_name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {variable.variable_type}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {variable.variable_type === 'boolean' ? 
                      (variable.variable_value === 'true' ? 'Verdadeiro' : 'Falso') : 
                      variable.variable_value}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {variable.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(variable)}
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(variable)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Variable className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma variável configurada ainda</p>
            <p className="text-sm">Clique em "Nova Variável" para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientVariables;
