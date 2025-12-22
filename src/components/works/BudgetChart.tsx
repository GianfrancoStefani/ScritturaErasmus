"use client";

import React from 'react';

interface BudgetChartProps {
  total: number;
  allocated: number;
  remaining: number;
}

export function BudgetChart({ total, allocated, remaining }: BudgetChartProps) {
  const allocatedPercent = total > 0 ? (allocated / total) * 100 : 0;
  const remainingPercent = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      <div className="flex justify-between text-sm text-slate-500 mb-1">
        <span>Budget Utilization</span>
        <span className="font-semibold">{Math.round(allocatedPercent)}%</span>
      </div>
      
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
        <div 
            className="h-full bg-indigo-500 transition-all duration-500" 
            style={{ width: `${Math.min(allocatedPercent, 100)}%` }}
            title={`Allocated: €${allocated.toLocaleString()}`}
        />
        {/* If over budget, show red segment? For now, nice clean bar */}
      </div>

      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>Allocated: €{allocated.toLocaleString()}</span>
        <span>Total: €{total.toLocaleString()}</span>
      </div>
    </div>
  );
}
