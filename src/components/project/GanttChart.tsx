"use client";

import { differenceInMonths, differenceInDays, addMonths, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useMemo } from "react";

type ProjectDates = {
    start: Date;
    end: Date;
}

type TimelineItem = {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    type: 'WORK' | 'TASK' | 'ACTIVITY';
    children?: TimelineItem[];
    progress?: number;
}

export function GanttChart({ 
    items, 
    projectStart, 
    projectEnd 
}: { 
    items: TimelineItem[]; 
    projectStart: Date; 
    projectEnd: Date;
}) {
    // 1. Calculate Grid
    const { months, totalMonths } = useMemo(() => {
        // Buffer: 1 month before and after
        const start = startOfMonth(new Date(projectStart));
        const end = endOfMonth(new Date(projectEnd));
        
        const total = differenceInMonths(end, start) + 1;
        
        const monthArray = [];
        for (let i = 0; i < total; i++) {
            monthArray.push(addMonths(start, i));
        }
        
        return { months: monthArray, totalMonths: total };
    }, [projectStart, projectEnd]);

    // Constant for grid layout
    const MONTH_WIDTH = 100; // px
    
    // Helper to calculate position
    const getPosition = (start: Date, end: Date) => {
        const gridStart = startOfMonth(new Date(projectStart));
        
        // Days from grid start to item start
        const startOffsetDays = differenceInDays(new Date(start), gridStart);
        // Duration in days
        const durationDays = differenceInDays(new Date(end), new Date(start));
        
        // Pixels per day (approx MONTH_WIDTH / 30)
        const pxPerDay = MONTH_WIDTH / 30.44; 
        
        return {
            left: Math.max(0, startOffsetDays * pxPerDay),
            width: Math.max(2, durationDays * pxPerDay) // Min 2px width
        };
    };

    // Recursive render row
    const renderRow = (item: TimelineItem, depth: number = 0): React.ReactNode => {
        const { left, width } = getPosition(item.startDate, item.endDate);
        
        const colorClass = 
            item.type === 'WORK' ? 'bg-blue-500' : 
            item.type === 'TASK' ? 'bg-green-500' : 
            'bg-purple-500';

        const heightClass = 
             item.type === 'WORK' ? 'h-6' : 
             item.type === 'TASK' ? 'h-4' : 
             'h-3';

        return (
            <>
                <div className="flex border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {/* Label Column */}
                    <div className="w-64 flex-shrink-0 p-2 border-r border-slate-200 bg-white sticky left-0 z-10 flex items-center">
                        <div style={{ paddingLeft: `${depth * 16}px` }} className="text-sm truncate font-medium text-slate-700" title={item.title}>
                             {item.title}
                        </div>
                    </div>
                    
                    {/* Timeline Column */}
                    <div className="relative flex-grow h-10" style={{ width: `${totalMonths * MONTH_WIDTH}px` }}>
                         {/* Bar */}
                         <div 
                            className={`absolute top-2 rounded shadow-sm ${colorClass} ${heightClass} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                            style={{ left: `${left}px`, width: `${width}px` }}
                            title={`${item.title}: ${format(new Date(item.startDate), 'MMM d')} - ${format(new Date(item.endDate), 'MMM d')}`}
                         />
                         
                         {/* Grid Lines (Vertical) - rendered repeatedly or once in parent? 
                             Rendered in parent is better for perf, but here we need alignment. 
                             Actually, we should put grid lines in a background layer.
                         */}
                    </div>
                </div>
                {item.children?.map(child => renderRow(child, depth + 1))}
            </>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm overflow-hidden">
             {/* Header */}
             <div className="flex border-b bg-slate-50 sticky top-0 z-20">
                <div className="w-64 flex-shrink-0 p-3 border-r font-bold text-slate-600 bg-slate-50 sticky left-0 z-30">
                    Task Name
                </div>
                <div className="flex-grow overflow-hidden" style={{ width: `${totalMonths * MONTH_WIDTH}px` }}>
                    <div className="flex">
                        {months.map(m => (
                            <div 
                                key={m.toString()} 
                                className="border-r border-slate-200 text-xs font-semibold text-slate-500 flex items-center justify-center bg-slate-50"
                                style={{ width: `${MONTH_WIDTH}px`, height: '40px' }}
                            >
                                {format(m, 'MMM yy')}
                            </div>
                        ))}
                    </div>
                </div>
             </div>

             {/* Body */}
             <div className="flex-1 overflow-auto relative">
                {/* Background Grid Lines Overlay */}
                <div className="absolute top-0 left-64 bottom-0 flex opacity-50 pointer-events-none" style={{ width: `${totalMonths * MONTH_WIDTH}px`, zIndex: 0 }}>
                     {months.map(m => (
                        <div 
                            key={m.toString()} 
                            className="border-r border-slate-100 h-full"
                            style={{ width: `${MONTH_WIDTH}px` }}
                        />
                    ))}
                </div>

                <div className="relative z-10" style={{ width: `${(totalMonths * MONTH_WIDTH) + 256}px` }}> 
                    {/* Width = Grid + Label Col. Actually Label Col is sticky, separate. 
                        Layout trick: "flex" container.
                    */}
                    {/* Let's redo renderRow structure slightly to be safer with sticky */}
                    
                    {items.map(item => renderRow(item))}
                </div>
             </div>
             
             {/* Legend */}
             <div className="p-2 bg-slate-50 border-t text-xs flex gap-4 text-slate-600">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div> Work Package</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div> Task</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded"></div> Activity</div>
             </div>
        </div>
    );
}
