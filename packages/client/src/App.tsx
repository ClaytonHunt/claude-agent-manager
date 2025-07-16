import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { 
  Dashboard, 
  AgentsPage, 
  ProjectsPage, 
  LogsPage, 
  AnalyticsPage 
} from '@/pages';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common';

// Lazy load AgentDetailPage for performance optimization
const AgentDetailPage = React.lazy(() => import('@/pages/AgentDetailPage'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route 
              path="agents/:id" 
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-64"><LoadingSpinner /></div>}>
                  <AgentDetailPage />
                </Suspense>
              } 
            />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;