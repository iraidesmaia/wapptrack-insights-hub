
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signup: (email: string, password: string, captchaToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isInitialLoad = useRef(true);
  const hasShownLoginToast = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Só mostrar toast de login quando é um login real, não quando retorna à aba
        if (event === 'SIGNED_IN' && session && !isInitialLoad.current && !hasShownLoginToast.current) {
          toast.success('Login realizado com sucesso!');
          hasShownLoginToast.current = true;
          navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          toast.info('Você saiu do sistema');
          hasShownLoginToast.current = false;
          navigate('/login');
        }
        
        // Após o primeiro carregamento, marcar como false
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Não mostrar toast no carregamento inicial se já estiver logado
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const login = async (email: string, password: string, captchaToken?: string): Promise<void> => {
    try {
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      setLoading(true);
      hasShownLoginToast.current = false; // Reset para permitir toast no próximo login
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      
      if (error) throw error;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, captchaToken?: string): Promise<void> => {
    try {
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      if (password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }
      
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          ...(captchaToken && { captchaToken })
        }
      });
      
      if (error) throw error;
      
      toast.success('Conta criada! Verifique seu email para confirmar.');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      hasShownLoginToast.current = false; // Reset para próximo login
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erro ao sair do sistema');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      login, 
      signup, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
