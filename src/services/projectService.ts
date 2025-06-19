
import { supabase } from "@/integrations/supabase/client";
import type { Project, CreateProjectData } from "@/types/project";

export const getProjects = async (): Promise<Project[]> => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar projetos:', error);
      throw error;
    }

    return projects || [];
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    return [];
  }
};

export const createProject = async (projectData: CreateProjectData): Promise<Project> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar projeto:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    throw error;
  }
};

export const updateProject = async (id: string, projectData: Partial<CreateProjectData>): Promise<Project> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...projectData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar projeto:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    throw error;
  }
};
