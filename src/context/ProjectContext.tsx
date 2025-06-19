
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { createClient, updateClient, getActiveClients } from '@/services/clientService';

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
  createProject: (name: string, description?: string) => Promise<boolean>;
  updateProject: (id: string, updates: Partial<Client>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
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
      
      const clients = await getActiveClients(user.id);
      
      // If no clients exist, create a default one
      if (clients.length === 0) {
        const newClient = await createClient({
          name: 'Projeto Principal',
          description: 'Projeto padrão do sistema',
          user_id: user.id,
          active: true
        });

        if (newClient) {
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

  const createProjectHandler = async (name: string, description?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const newClient = await createClient({
        name,
        description,
        user_id: user.id,
        active: true
      });

      if (newClient) {
        await loadProjects();
        setActiveProject(newClient);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating project:', error);
      return false;
    }
  };

  const updateProjectHandler = async (id: string, updates: Partial<Client>): Promise<boolean> => {
    try {
      const updatedClient = await updateClient(id, updates);
      
      if (updatedClient) {
        setProjects(prev => prev.map(p => p.id === id ? updatedClient : p));
        
        if (activeProject?.id === id) {
          setActiveProjectState(updatedClient);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  };

  const deleteProjectHandler = async (id: string): Promise<boolean> => {
    try {
      const result = await updateClient(id, { active: false });
      
      if (result) {
        await loadProjects();
        
        if (activeProject?.id === id) {
          const remainingProjects = projects.filter(p => p.id !== id && p.active);
          setActiveProject(remainingProjects[0] || null);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
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
        createProject: createProjectHandler,
        updateProject: updateProjectHandler,
        deleteProject: deleteProjectHandler,
        isLoading
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
