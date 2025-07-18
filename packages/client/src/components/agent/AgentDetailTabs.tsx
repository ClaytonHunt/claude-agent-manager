import React, { useState, ReactNode, useMemo } from 'react';
import { cn } from '@/utils';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface AgentDetailTabsProps {
  tabs: TabItem[];
  defaultActiveTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function AgentDetailTabs({ 
  tabs, 
  defaultActiveTab, 
  className,
  onTabChange 
}: AgentDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(
    defaultActiveTab || tabs[0]?.id || ''
  );

  const handleTabChange = (tabId: string) => {
    if (tabs.find(tab => tab.id === tabId)?.disabled) {
      return;
    }
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabContent = useMemo(() => {
    return tabs.find(tab => tab.id === activeTab)?.content;
  }, [tabs, activeTab]);

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                {
                  // Active tab styles
                  'border-primary-500 text-primary-600': activeTab === tab.id && !tab.disabled,
                  // Inactive tab styles
                  'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': 
                    activeTab !== tab.id && !tab.disabled,
                  // Disabled tab styles
                  'border-transparent text-gray-300 cursor-not-allowed': tab.disabled,
                }
              )}
            >
              {/* Tab icon */}
              {tab.icon && (
                <span className={cn(
                  'mr-2 flex-shrink-0',
                  {
                    'text-primary-500': activeTab === tab.id && !tab.disabled,
                    'text-gray-400 group-hover:text-gray-500': activeTab !== tab.id && !tab.disabled,
                    'text-gray-300': tab.disabled,
                  }
                )}>
                  {tab.icon}
                </span>
              )}
              
              {/* Tab label */}
              <span>{tab.label}</span>
              
              {/* Tab badge */}
              {tab.badge && (
                <span className={cn(
                  'ml-2 py-0.5 px-2 rounded-full text-xs font-medium',
                  {
                    'bg-primary-100 text-primary-600': activeTab === tab.id && !tab.disabled,
                    'bg-gray-100 text-gray-600': activeTab !== tab.id && !tab.disabled,
                    'bg-gray-50 text-gray-300': tab.disabled,
                  }
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTabContent ? (
          <div key={activeTab} className="transition-opacity duration-200">
            {activeTabContent}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No content available for this tab.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience hook for managing tab state externally if needed
export function useAgentDetailTabs(tabs: TabItem[], defaultTab?: string) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  
  const changeTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      setActiveTab(tabId);
    }
  };

  const getActiveTab = () => tabs.find(tab => tab.id === activeTab);
  
  return {
    activeTab,
    setActiveTab: changeTab,
    getActiveTab,
    tabs,
  };
}