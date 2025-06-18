
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  DollarSign, 
  LogOut,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { CompanySettings, Theme } from '@/types';

type MainLayoutProps = {
  children: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard, 
      current: location.pathname === '/dashboard' 
    },
    { 
      name: 'Leads', 
      href: '/leads', 
      icon: Users, 
      current: location.pathname === '/leads' 
    },
    { 
      name: 'Campanhas', 
      href: '/campaigns', 
      icon: MessageSquare, 
      current: location.pathname === '/campaigns' 
    },
    { 
      name: 'Vendas', 
      href: '/sales', 
      icon: DollarSign, 
      current: location.pathname === '/sales' 
    },
    { 
      name: 'Configurações', 
      href: '/settings', 
      icon: Settings, 
      current: location.pathname === '/settings' 
    },
  ];

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading company settings:', error);
      } else if (data) {
        // Ensure theme is properly typed
        const typedData: CompanySettings = {
          ...data,
          theme: (data.theme as Theme) || 'system'
        };
        setCompanySettings(typedData);
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Default company branding configuration
  const defaultCompanyBranding = {
    logo: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&h=150&q=80",
    title: "Sua Empresa",
    subtitle: "Sistema de Marketing"
  };

  // Use company settings if available, otherwise use default
  const companyBranding = {
    logo: companySettings?.logo_url || defaultCompanyBranding.logo,
    title: companySettings?.company_name || defaultCompanyBranding.title,
    subtitle: companySettings?.company_subtitle || defaultCompanyBranding.subtitle
  };

  // Get user display name - use email as fallback since Supabase User doesn't have name
  const getUserDisplayName = () => {
    return user?.email || 'Usuário';
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    const email = user?.email;
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  const BrandingSection = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn(
      "flex items-center space-x-3 px-4 py-4",
      isMobile ? "justify-center" : ""
    )}>
      <div className="flex-shrink-0">
        {isLoadingSettings ? (
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse border-2 border-primary/20" />
        ) : (
          <img
            src={companyBranding.logo}
            alt="Logo da empresa"
            className="h-12 w-12 rounded-full object-cover border-2 border-primary/20"
          />
        )}
      </div>
      <div className="flex flex-col">
        {isLoadingSettings ? (
          <>
            <div className="h-6 w-24 bg-muted animate-pulse rounded mb-1" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </>
        ) : (
          <>
            <span className="font-bold text-lg text-primary">{companyBranding.title}</span>
            <span className="text-sm text-muted-foreground">{companyBranding.subtitle}</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile menu button */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border">
        <BrandingSection isMobile />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="lg:hidden"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
          <div className="flex flex-col flex-1 h-full">
            <div className="flex items-center h-20 flex-shrink-0 border-b border-border">
              <Link to="/dashboard" className="w-full">
                <BrandingSection />
              </Link>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )
                  }
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-border flex flex-col space-y-2">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                  {getUserInitial()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">
                    {getUserDisplayName()}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="flex justify-start" 
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <BrandingSection isMobile />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
              >
                <X />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <nav className="space-y-4">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={toggleMobileMenu}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-4 py-3 text-base rounded-md transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      )
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                  {getUserInitial()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">
                    {getUserDisplayName()}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full flex justify-center" 
                onClick={() => {
                  logout();
                  toggleMobileMenu();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 lg:ml-64 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
