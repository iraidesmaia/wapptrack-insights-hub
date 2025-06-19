
import React, { useState } from 'react';
import { ChevronDown, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useProject } from '@/context/ProjectContext';
import { CreateProjectDialog } from './CreateProjectDialog';

const ProjectSelector = () => {
  const { currentProject, projects, setCurrentProject } = useProject();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="px-4 py-3 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between h-auto p-3 hover:bg-muted"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {currentProject?.logo_url ? (
                    <img
                      src={currentProject.logo_url}
                      alt={currentProject.name}
                      className="h-8 w-8 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">
                    {currentProject?.name || 'Selecionar Projeto'}
                  </span>
                  {currentProject?.description && (
                    <span className="text-xs text-muted-foreground">
                      {currentProject.description}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => setCurrentProject(project)}
                className="flex items-center space-x-3 p-3"
              >
                <div className="flex-shrink-0">
                  {project.logo_url ? (
                    <img
                      src={project.logo_url}
                      alt={project.name}
                      className="h-6 w-6 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-3 w-3 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{project.name}</div>
                  {project.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {project.description}
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center space-x-3 p-3"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Novo Projeto</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  );
};

export default ProjectSelector;
