
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProjects } from '@/services/projectService';
import type { Project } from '@/types/project';
import { toast } from 'sonner';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project) => void;
  refreshProjects: () => Promise<void>;
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
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { projectId } = useParams();

  const refreshProjects = async () => {
    try {
      setIsLoading(true);
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
      
      // Se há um projectId na URL, encontrar e definir o projeto atual
      if (projectId && fetchedProjects.length > 0) {
        const project = fetchedProjects.find(p => p.id === projectId);
        if (project) {
          setCurrentProjectState(project);
        } else {
          // Se o projeto não foi encontrado, redirecionar para o primeiro projeto
          const firstProject = fetchedProjects[0];
          setCurrentProjectState(firstProject);
          navigate(`/project/${firstProject.id}/dashboard`, { replace: true });
        }
      } else if (fetchedProjects.length > 0 && !currentProject) {
        // Se não há projeto atual e há projetos disponíveis, definir o primeiro
        const firstProject = fetchedProjects[0];
        setCurrentProjectState(firstProject);
        navigate(`/project/${firstProject.id}/dashboard`, { replace: true });
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentProject = (project: Project) => {
    setCurrentProjectState(project);
    // Manter a mesma página, mas trocar o projeto
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/');
    if (pathSegments[1] === 'project' && pathSegments[3]) {
      const pageName = pathSegments[3];
      navigate(`/project/${project.id}/${pageName}`);
    } else {
      navigate(`/project/${project.id}/dashboard`);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, [projectId]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        setCurrentProject,
        refreshProjects,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
