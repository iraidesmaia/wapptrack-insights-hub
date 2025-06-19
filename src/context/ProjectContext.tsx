
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Client {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectContextType {
  activeProject: Client | null;
  projects: Client[];
  setActiveProject: (project: Client | null) => void;
  loadProjects: () => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [activeProject, setActiveProjectState] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = async () => {
    if (!user) {
      setProjects([]);
      setActiveProject(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      const clients = clientsData || [];
      
      // If no clients exist, create a default one
      if (clients.length === 0) {
        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert({
            name: 'Projeto Principal',
            description: 'Projeto padrão do sistema',
            user_id: user.id,
            active: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating default client:', createError);
        } else if (newClient) {
          clients.push(newClient);
        }
      }

      setProjects(clients);

      // Set active project from localStorage or default to first project
      const savedProjectId = localStorage.getItem('activeProjectId');
      const savedProject = clients.find(p => p.id === savedProjectId);
      const projectToSet = savedProject || clients[0] || null;
      
      setActiveProjectState(projectToSet);
      
      if (projectToSet) {
        localStorage.setItem('activeProjectId', projectToSet.id);
      }
    } catch (error) {
      console.error('Error in loadProjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveProject = (project: Client | null) => {
    setActiveProjectState(project);
    if (project) {
      localStorage.setItem('activeProjectId', project.id);
    } else {
      localStorage.removeItem('activeProjectId');
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user]);

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        projects,
        setActiveProject,
        loadProjects,
        isLoading
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
