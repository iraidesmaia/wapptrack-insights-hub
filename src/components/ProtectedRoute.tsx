
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Mostrar loading enquanto verifica autenticação
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se usuário não está autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Se usuário está autenticado, renderizar os filhos
  return <>{children}</>;
};

export default ProtectedRoute;
