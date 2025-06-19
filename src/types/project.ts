
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  logo_url?: string;
}
