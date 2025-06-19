
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from 'lucide-react';
import { CreateProjectDialog } from './CreateProjectDialog';

interface ProjectWelcomeProps {
  onCreateProject: () => void;
}

const ProjectWelcome: React.FC<ProjectWelcomeProps> = ({ onCreateProject }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Bem-vindo!</CardTitle>
          <CardDescription>
            Para começar, você precisa criar seu primeiro projeto. 
            Projetos ajudam a organizar suas campanhas, leads e vendas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={onCreateProject}
            className="w-full"
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Projeto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectWelcome;
