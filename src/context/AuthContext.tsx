
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Validate email and password
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      if (password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Se o usuário não existe, tentar criar uma conta
        if (error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`
            }
          });

          if (signUpError) {
            throw signUpError;
          }

          if (signUpData.user && !signUpData.session) {
            toast.info('Verifique seu email para confirmar a conta');
            return;
          }
        } else {
          throw error;
        }
      }
      
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast.info('Você saiu do sistema');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao sair do sistema');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      login, 
      logout, 
      isAuthenticated: !!session 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
