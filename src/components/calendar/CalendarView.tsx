"use client";

import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isWithinInterval,
  parseISO 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  type: 'project' | 'work' | 'deadline';
  color?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // normalize dates for comparison
  const normalizedEvents = events.map(e => ({
      ...e,
      start: typeof e.startDate === 'string' ? parseISO(e.startDate) : e.startDate,
      end: typeof e.endDate === 'string' ? parseISO(e.endDate) : e.endDate,
  }));

  const getEventsForDay = (day: Date) => {
      return normalizedEvents.filter(event => 
          isWithinInterval(day, { start: event.start, end: event.end })
      );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">
                {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-1">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Previous Month">
                    <ChevronLeft size={20} />
                </button>
                <button onClick={today} className="px-3 py-1 text-sm font-medium hover:bg-slate-100 rounded text-slate-600">
                    Today
                </button>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Next Month">
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {weekDays.map(day => (
            <div key={day} className="py-2 text-center text-sm font-semibold text-slate-500 uppercase tracking-wide">
                {day}
            </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-[1fr]">
         {calendarDays.map((day, idx) => {
             const dayEvents = getEventsForDay(day);
             return (
                 <div 
                    key={day.toISOString()} 
                    className={clsx(
                        "min-h-[100px] border-b border-r border-slate-100 p-2 relative transition-colors hover:bg-slate-50/50",
                        !isSameMonth(day, monthStart) && "bg-slate-50/30 text-slate-400",
                        isSameDay(day, new Date()) && "bg-indigo-50/30 font-semibold"
                    )}
                >
                    <div className={clsx(
                        "text-sm mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                        isSameDay(day, new Date()) ? "bg-indigo-600 text-white" : "text-slate-700"
                    )}>
                        {format(day, 'd')}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        {dayEvents.map(event => {
                            // Only show start label if it's the start date OR the first day of the week displayed
                            const isStart = isSameDay(day, event.start) || isSameDay(day, startDate);
                             
                            return (
                                <div 
                                    key={`${event.id}-${day.toString()}`}
                                    className={clsx(
                                        "text-xs px-1.5 py-0.5 rounded truncate shadow-sm",
                                        event.type === 'project' ? "bg-indigo-100 text-indigo-700 border border-indigo-200" :
                                        event.type === 'work' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                        "bg-amber-100 text-amber-700 border border-amber-200"
                                    )}
                                    title={event.title}
                                >
                                    {event.title}
                                </div>
                            );
                        })}
                    </div>
                 </div>
             );
         })}
      </div>
    </div>
  );
}
