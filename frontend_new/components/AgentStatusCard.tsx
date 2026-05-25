// Agent Status Card Component
// Displays the current status of an AI agent in the Scrum Team

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Cpu, Clock, Zap } from 'lucide-react';

interface AgentStatusCardProps {
  agentId: string;
  agentName: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  lastActive?: Date;
  tasksCompleted?: number;
  cpuUsage?: number;
}

const statusColors = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  idle: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  offline: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({
  agentId,
  agentName,
  status,
  lastActive,
  tasksCompleted = 0,
  cpuUsage = 0,
}) => {
  const formatTimeAgo = (date?: Date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-100">{agentName}</CardTitle>
          <Badge className={`${statusColors[status]} border`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              status === 'active' ? 'bg-emerald-400' :
              status === 'idle' ? 'bg-amber-400' :
              status === 'error' ? 'bg-red-400' : 'bg-slate-400'
            }`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-3 rounded-lg bg-slate-800/50">
            <Activity className="w-5 h-5 text-blue-400 mb-2" />
            <span className="text-xs text-slate-400">Tasks</span>
            <span className="text-lg font-bold text-slate-100">{tasksCompleted}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-slate-800/50">
            <Cpu className="w-5 h-5 text-purple-400 mb-2" />
            <span className="text-xs text-slate-400">CPU</span>
            <span className="text-lg font-bold text-slate-100">{cpuUsage}%</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-slate-800/50">
            <Clock className="w-5 h-5 text-orange-400 mb-2" />
            <span className="text-xs text-slate-400">Last Active</span>
            <span className="text-sm font-medium text-slate-100">{formatTimeAgo(lastActive)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};