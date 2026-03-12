import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  Settings,
  BarChart3,
  PlusCircle
} from 'lucide-react';

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/service-orders', icon: FileText, label: 'OS' },
    { path: '/clients', icon: Users, label: 'Clientes' },
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/settings', icon: Settings, label: 'Config' }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-sky-600">Giartech</h1>
          <button
            onClick={() => navigate('/service-orders/new')}
            className="bg-sky-500 text-white p-2 rounded-lg active:bg-sky-600 transition-colors"
            aria-label="Nova OS"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active
                    ? 'text-sky-600'
                    : 'text-gray-500 active:text-sky-500'
                }`}
                aria-label={item.label}
              >
                <Icon className={`w-6 h-6 ${active ? 'stroke-2' : 'stroke-1.5'}`} />
                <span className={`text-xs mt-1 ${active ? 'font-semibold' : 'font-normal'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
