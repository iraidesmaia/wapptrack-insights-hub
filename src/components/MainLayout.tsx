
import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  DollarSign, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

type MainLayoutProps = {
  children: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile menu button */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <Link to="/dashboard" className="flex items-center">
          <span className="font-bold text-xl text-primary">WappTrack</span>
        </Link>
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
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r">
          <div className="flex flex-col flex-1 h-full">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <span className="font-bold text-xl text-primary">WappTrack</span>
              </Link>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-4 py-2 text-sm rounded-md",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-700 hover:bg-gray-100"
                    )
                  }
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="px-4 py-4 border-t flex flex-col space-y-2">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white">
                  {user?.name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name || user?.email}
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
          <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <Link to="/dashboard" className="flex items-center">
                <span className="font-bold text-xl text-primary">WappTrack</span>
              </Link>
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
                        "flex items-center px-4 py-3 text-base rounded-md",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-700 hover:bg-gray-100"
                      )
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white">
                  {user?.name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name || user?.email}
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
