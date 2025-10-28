import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
  badge?: number;
  description?: string;
}

interface TabContainerProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
}

export function TabContainer({ tabs, defaultTab, className = '' }: TabContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center space-x-1 px-6 py-4 overflow-x-auto scrollbar-thin">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center space-x-2 px-4 py-2.5 rounded-lg
                  transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>{tab.label}</span>

                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`
                    ml-1 px-2 py-0.5 text-xs font-semibold rounded-full
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {activeTabData?.description && (
          <div className="px-6 pb-3">
            <p className="text-sm text-gray-600">{activeTabData.description}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTabData && <activeTabData.component />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
