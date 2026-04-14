"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { Trophy, Users, TrendUp, Medal } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface PeerBenchmarkingProps {
  rank: number;
  percentile: number;
  comparativeAnalysis: { name: string; value: number; color: string }[];
}

export function PeerBenchmarking({
  rank,
  percentile,
  comparativeAnalysis
}: PeerBenchmarkingProps) {
  return (
    <div className="student-surface rounded-xl overflow-hidden border border-[var(--student-border)] bg-white shadow-sm flex flex-col h-full">
      <div className="px-6 pt-6 pb-2 border-b border-gray-50 bg-gray-50/30">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Peer Benchmarking</h2>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Competitive Standings</p>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        {/* HERO RANK CARD */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900 p-6 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 opacity-60">
                <Medal size={14} weight="bold" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Current Rank</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter">#{rank || "---"}</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Top {100 - Math.round(percentile)}%
                </span>
              </div>
            </div>
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <Trophy size={28} weight="fill" className="text-amber-400" />
            </div>
          </div>
        </div>

        {/* COMPARATIVE ANALYSIS CHART */}
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score Benchmark</h3>
            <span className="text-[9px] font-bold text-slate-300 italic">vs Batch Cohort</span>
          </div>
          
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparativeAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  hide 
                />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                  {comparativeAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {comparativeAnalysis.map((item) => (
              <div key={item.name} className="p-3 rounded-lg border border-gray-50 bg-gray-50/50">
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mb-1 truncate">{item.name}</div>
                <div className="text-sm font-black text-slate-900">{item.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
