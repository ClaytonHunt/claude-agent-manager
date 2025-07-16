import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeMode, DashboardView, LogViewerState } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

interface UiStore {
  // Theme
  theme: ThemeMode;
  isDarkMode: boolean;
  
  // Layout
  sidebarCollapsed: boolean;
  
  // Dashboard
  dashboardView: DashboardView;
  
  // Log viewer
  logViewerState: LogViewerState;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
  
  // Modals and overlays
  modals: {
    agentDetails: boolean;
    settings: boolean;
    about: boolean;
  };
  
  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setDashboardView: (view: Partial<DashboardView>) => void;
  setLogViewerState: (state: Partial<LogViewerState>) => void;
  addNotification: (notification: Omit<UiStore['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  openModal: (modal: keyof UiStore['modals']) => void;
  closeModal: (modal: keyof UiStore['modals']) => void;
  closeAllModals: () => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      isDarkMode: false,
      sidebarCollapsed: false,
      dashboardView: {
        layout: 'grid',
        sortBy: 'lastActivity',
        sortOrder: 'desc',
        showInactive: true,
      },
      logViewerState: {
        autoScroll: true,
        filter: {
          level: ['info', 'warn', 'error'],
          search: '',
        },
        maxLines: 1000,
      },
      notifications: [],
      modals: {
        agentDetails: false,
        settings: false,
        about: false,
      },

      // Theme actions
      setTheme: (theme) => {
        set({ theme });
        
        // Update dark mode based on theme and system preference
        if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          set({ isDarkMode: prefersDark });
        } else {
          set({ isDarkMode: theme === 'dark' });
        }
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // Layout actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      toggleSidebar: () => {
        const { sidebarCollapsed } = get();
        set({ sidebarCollapsed: !sidebarCollapsed });
      },

      // Dashboard actions
      setDashboardView: (view) => set((state) => ({
        dashboardView: { ...state.dashboardView, ...view },
      })),

      // Log viewer actions
      setLogViewerState: (newState) => set((state) => ({
        logViewerState: { ...state.logViewerState, ...newState },
      })),

      // Notification actions
      addNotification: (notification) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newNotification = {
          ...notification,
          id,
          timestamp: new Date(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only last 50
        }));
        
        // Auto-remove info notifications after 5 seconds
        if (notification.type === 'info') {
          setTimeout(() => {
            get().removeNotification(id);
          }, 5000);
        }
      },

      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      })),

      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ),
      })),

      clearAllNotifications: () => set({ notifications: [] }),

      // Modal actions
      openModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: true },
      })),

      closeModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: false },
      })),

      closeAllModals: () => set({
        modals: {
          agentDetails: false,
          settings: false,
          about: false,
        },
      }),
    }),
    {
      name: STORAGE_KEYS.DASHBOARD_VIEW,
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        dashboardView: state.dashboardView,
        logViewerState: state.logViewerState,
      }),
    }
  )
);

// System theme detection
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    const { theme, setTheme } = useUiStore.getState();
    if (theme === 'system') {
      useUiStore.setState({ isDarkMode: e.matches });
    }
  });
  
  // Initialize dark mode on first load
  const { theme } = useUiStore.getState();
  if (theme === 'system') {
    useUiStore.setState({ isDarkMode: mediaQuery.matches });
  }
}