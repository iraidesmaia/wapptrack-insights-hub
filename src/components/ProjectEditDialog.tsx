
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProject } from '@/context/ProjectContext';
import { toast } from 'sonner';

interface ProjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  projectId?: string;
}

const ProjectEditDialog: React.FC<ProjectEditDialogProps> = ({
  open,
  onOpenChange,
  mode,
  projectId
}) => {
  const { activeProject, createProject, updateProject } = useProject();
  const [name, setName] = useState(mode === 'edit' ? activeProject?.name || '' : '');
  const [description, setDescription] = useState(mode === 'edit' ? activeProject?.description || '' : '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      let success = false;

      if (mode === 'create') {
        success = await createProject(name, description);
        if (success) {
          toast.success('Projeto criado com sucesso!');
        }
      } else if (mode === 'edit' && projectId) {
        success = await updateProject(projectId, { name, description });
        if (success) {
          toast.success('Projeto atualizado com sucesso!');
        }
      }

      if (success) {
        onOpenChange(false);
        setName('');
        setDescription('');
      } else {
        toast.error('Erro ao salvar projeto');
      }
    } catch (error) {
      toast.error('Erro ao salvar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Novo Projeto' : 'Editar Projeto'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do projeto"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do projeto (opcional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditDialog;
