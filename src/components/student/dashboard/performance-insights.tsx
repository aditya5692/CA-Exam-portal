"use client";

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from "@/lib/utils";
import { Target, ChartLineUp, Brain, Timer } from "@phosphor-icons/react";
import * as Tabs from "@radix-ui/react-tabs";

interface PerformanceInsightsProps {
  performanceTrend: { date: string; score: number }[];
  subjectAccuracy: { subject: string; accuracy: number }[];
  errorDistribution: { name: string; label: string; value: number; color: string }[];
}

export function PerformanceInsights({
  performanceTrend,
  subjectAccuracy,
  errorDistribution
}: PerformanceInsightsProps) {
  return (
    <div className="student-surface rounded-xl overflow-hidden border border-[var(--student-border)] bg-white shadow-sm">
      <Tabs.Root defaultValue="trend" className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-gray-50 bg-gray-50/30">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Intelligence Hub</h2>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Diagnostic Performance Analysis</p>
          </div>
          <Tabs.List className="flex bg-slate-100/50 p-1 rounded-lg gap-1">
            <Tabs.Trigger
              value="trend"
              className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-slate-400"
            >
              Trend
            </Tabs.Trigger>
            <Tabs.Trigger
              value="mastery"
              className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-slate-400"
            >
              Mastery
            </Tabs.Trigger>
            <Tabs.Trigger
              value="errors"
              className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-slate-400"
            >
              Gaps
            </Tabs.Trigger>
          </Tabs.List>
        </div>

        <div className="p-6 h-[300px]">
          <Tabs.Content value="trend" className="h-full outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#4f46e5" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Tabs.Content>

          <Tabs.Content value="mastery" className="h-full outline-none flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectAccuracy}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 8, fontWeight: 700, fill: '#64748b', transform: 'translate(0, 0)' }}
                />
                <Radar
                  name="Proficiency"
                  dataKey="accuracy"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.5}
                  animationDuration={1500}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Tabs.Content>

          <Tabs.Content value="errors" className="h-full outline-none">
            <div className="grid grid-cols-2 h-full items-center">
              <div className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {errorDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4 pr-4">
                {errorDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{item.value}%</span>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-slate-50">
                   <p className="text-[9px] font-medium text-slate-400 italic">Based on last 50 submissions</p>
                </div>
              </div>
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
