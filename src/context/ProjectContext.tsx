
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client } from '@/types';
import { getClients } from '@/services/clientService';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  activeProject: Client | null;
  projects: Client[];
  setActiveProject: (project: Client | null) => void;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const PROJECT_STORAGE_KEY = 'activeProject';

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeProject, setActiveProjectState] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const clientsData = await getClients();
      setProjects(clientsData);
      
      // Se não houver projeto ativo, tentar carregar do localStorage
      if (!activeProject && clientsData.length > 0) {
        const savedProjectId = localStorage.getItem(PROJECT_STORAGE_KEY);
        const savedProject = savedProjectId 
          ? clientsData.find(p => p.id === savedProjectId)
          : clientsData[0]; // Fallback para o primeiro projeto
        
        if (savedProject) {
          setActiveProjectState(savedProject);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveProject = (project: Client | null) => {
    setActiveProjectState(project);
    if (project) {
      localStorage.setItem(PROJECT_STORAGE_KEY, project.id);
    } else {
      localStorage.removeItem(PROJECT_STORAGE_KEY);
    }
  };

  const refreshProjects = async () => {
    await loadProjects();
  };

  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setActiveProject(null);
      setProjects([]);
      setIsLoading(false);
    }
  }, [user]);

  return (
    <ProjectContext.Provider value={{
      activeProject,
      projects,
      setActiveProject,
      isLoading,
      refreshProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject deve ser usado dentro de um ProjectProvider');
  }
  return context;
};
