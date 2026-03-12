import { ReactNode } from 'react';
import { useMobileDetect } from '../hooks/useMobileDetect';
import MobileLayout from './mobile/MobileLayout';

interface ResponsiveWrapperProps {
  children: ReactNode;
  desktopSidebar?: ReactNode;
}

export default function ResponsiveWrapper({ children, desktopSidebar }: ResponsiveWrapperProps) {
  const { isMobile } = useMobileDetect();

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {desktopSidebar && (
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          {desktopSidebar}
        </aside>
      )}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
