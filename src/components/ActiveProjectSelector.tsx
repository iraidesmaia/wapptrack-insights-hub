
import React, { useState } from 'react';
import { Plus, Check, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useProject } from '@/context/ProjectContext';
import { Badge } from "@/components/ui/badge";

export const ActiveProjectSelector: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  const { activeProject, projects, setActiveProject, isLoading } = useProject();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-6 w-6 bg-muted animate-pulse rounded" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Nenhum projeto</span>
      </div>
    );
  }

  if (isMobile) {
    return (
      <Select
        value={activeProject?.id || ''}
        onValueChange={(value) => {
          const project = projects.find(p => p.id === value);
          setActiveProject(project || null);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecionar projeto">
            {activeProject && (
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>{activeProject.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>{project.name}</span>
                {project.description && (
                  <Badge variant="outline" className="text-xs">
                    {project.description}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Building2 className="h-4 w-4" />
          <span>{activeProject?.name || 'Selecionar projeto'}</span>
          {activeProject && (
            <Badge variant="secondary" className="ml-2">
              Ativo
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Projetos Ativos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => setActiveProject(project)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{project.name}</span>
              {project.description && (
                <span className="text-xs text-muted-foreground">
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
        <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Novo projeto</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
