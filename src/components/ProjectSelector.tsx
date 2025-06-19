
import React, { useState } from 'react';
import { Check, ChevronDown, Briefcase, Plus, Edit, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useProject } from '@/context/ProjectContext';
import ProjectEditDialog from './ProjectEditDialog';

const ProjectSelector: React.FC = () => {
  const { activeProject, projects, setActiveProject, isLoading } = useProject();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');

  const handleCreateProject = () => {
    setEditMode('create');
    setEditDialogOpen(true);
  };

  const handleEditProject = () => {
    setEditMode('edit');
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center space-x-2 min-w-[200px] justify-between"
          >
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4" />
              <span className="truncate">
                {activeProject ? activeProject.name : 'Selecionar Projeto'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px] bg-popover" align="start">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-muted-foreground">
              Projetos Ativos ({projects.length})
            </p>
          </div>
          <DropdownMenuSeparator />
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => setActiveProject(project)}
              className="flex items-center justify-between p-3 cursor-pointer"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{project.name}</span>
                {project.description && (
                  <span className="text-sm text-muted-foreground">
                    {project.description}
                  </span>
                )}
              </div>
              {activeProject?.id === project.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="p-3 cursor-pointer" onClick={handleCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            <span>Novo Projeto</span>
          </DropdownMenuItem>
          {activeProject && (
            <DropdownMenuItem className="p-3 cursor-pointer" onClick={handleEditProject}>
              <Edit className="h-4 w-4 mr-2" />
              <span>Editar Projeto Atual</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        mode={editMode}
        projectId={activeProject?.id}
      />
    </>
  );
};

export default ProjectSelector;
