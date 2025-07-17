import React from 'react';
import { Activity, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/common';

interface MissionControlDashboardProps {
  agents: any[];
}

export function MissionControlDashboard({ agents }: MissionControlDashboardProps) {
  const activeAgents = agents.filter(agent => agent.status === 'active');
  const completedAgents = agents.filter(agent => agent.status === 'complete');
  const errorAgents = agents.filter(agent => agent.status === 'error');
  
  const totalRuntime = agents.reduce((total, agent) => {
    return total + (Date.now() - new Date(agent.created).getTime());
  }, 0);
  
  const avgRuntimeHours = agents.length > 0 ? Math.round(totalRuntime / (agents.length * 1000 * 60 * 60)) : 0;

  const metrics = [
    {
      title: 'Active Agents',
      value: activeAgents.length,
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Completed Tasks',
      value: completedAgents.length,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Avg Runtime',
      value: `${avgRuntimeHours}h`,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Error Rate',
      value: `${Math.round((errorAgents.length / Math.max(agents.length, 1)) * 100)}%`,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mission Control</h1>
        <p className="text-gray-600">Development Intelligence Platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <div className={`${metric.textColor}`}>
                    {metric.icon}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Intelligence Engine</h3>
            <p className="text-gray-600 mb-4">
              Advanced analytics, pattern recognition, and workflow optimization
            </p>
            <div className="text-sm text-gray-500">
              Phase 2 Implementation • Analytics Pipeline • ML Insights
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}