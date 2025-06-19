
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { getClientVariables, upsertClientVariable, deleteClientVariable, ClientVariable } from '@/services/clientVariablesService';
import { toast } from 'sonner';

const ProjectSettings: React.FC = () => {
  const { activeProject, updateProject } = useProject();
  const [projectName, setProjectName] = useState(activeProject?.name || '');
  const [projectDescription, setProjectDescription] = useState(activeProject?.description || '');
  const [variables, setVariables] = useState<ClientVariable[]>([]);
  const [newVariable, setNewVariable] = useState({
    name: '',
    value: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeProject) {
      setProjectName(activeProject.name);
      setProjectDescription(activeProject.description || '');
      loadVariables();
    }
  }, [activeProject]);

  const loadVariables = async () => {
    if (!activeProject) return;
    const data = await getClientVariables(activeProject.id);
    setVariables(data);
  };

  const handleSaveProject = async () => {
    if (!activeProject) return;
    
    setIsLoading(true);
    try {
      const success = await updateProject(activeProject.id, {
        name: projectName,
        description: projectDescription
      });

      if (success) {
        toast.success('Projeto atualizado com sucesso!');
      } else {
        toast.error('Erro ao atualizar projeto');
      }
    } catch (error) {
      toast.error('Erro ao salvar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVariable = async () => {
    if (!activeProject || !newVariable.name || !newVariable.value) {
      toast.error('Nome e valor da variável são obrigatórios');
      return;
    }

    const result = await upsertClientVariable(
      activeProject.id,
      newVariable.name,
      newVariable.value,
      'text',
      newVariable.description
    );

    if (result) {
      toast.success('Variável adicionada com sucesso!');
      setNewVariable({ name: '', value: '', description: '' });
      loadVariables();
    } else {
      toast.error('Erro ao adicionar variável');
    }
  };

  const handleDeleteVariable = async (id: string) => {
    const success = await deleteClientVariable(id);
    if (success) {
      toast.success('Variável removida com sucesso!');
      loadVariables();
    } else {
      toast.error('Erro ao remover variável');
    }
  };

  if (!activeProject) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Nenhum projeto selecionado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Configurações do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nome do Projeto</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Nome do projeto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Badge variant={activeProject.active ? "default" : "secondary"}>
                {activeProject.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-description">Descrição</Label>
            <Textarea
              id="project-description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Descrição do projeto"
              rows={3}
            />
          </div>

          <Button onClick={handleSaveProject} disabled={isLoading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Projeto'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variáveis do Projeto</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure variáveis específicas para este projeto
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Nome da Variável</Label>
              <Input
                value={newVariable.name}
                onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                placeholder="Ex: default_message"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                value={newVariable.value}
                onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
                placeholder="Valor da variável"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={newVariable.description}
                onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
          </div>
          
          <Button onClick={handleAddVariable} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Variável
          </Button>

          <Separator />

          <div className="space-y-3">
            {variables.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma variável configurada
              </p>
            ) : (
              variables.map((variable) => (
                <div key={variable.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{variable.variable_name}</div>
                    <div className="text-sm text-muted-foreground">{variable.variable_value}</div>
                    {variable.description && (
                      <div className="text-xs text-muted-foreground">{variable.description}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteVariable(variable.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectSettings;
