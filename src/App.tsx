
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import { ThemeProvider } from "./hooks/useTheme";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Campaigns from "./pages/Campaigns";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Redirect from "./pages/Redirect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/ir" element={<Redirect />} />
              
              {/* Rotas antigas - redirecionam para o primeiro projeto */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <Navigate to="/project/auto/dashboard" replace />
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/leads" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <Navigate to="/project/auto/leads" replace />
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/campaigns" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <Navigate to="/project/auto/campaigns" replace />
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/sales" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <Navigate to="/project/auto/sales" replace />
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <Navigate to="/project/auto/settings" replace />
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              
              {/* Novas rotas com projectId */}
              <Route path="/project/:projectId/dashboard" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <Dashboard />
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/project/:projectId/leads" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <Leads />
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/project/:projectId/campaigns" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <Campaigns />
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/project/:projectId/sales" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <Sales />
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/project/:projectId/settings" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <Settings />
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
