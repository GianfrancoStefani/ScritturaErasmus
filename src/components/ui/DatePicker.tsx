"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { format, addMonths, subMonths, setMonth, setYear, getMonth, getYear, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DatePickerProps {
    value?: string; // yyyy-MM-dd
    onChange: (date: string) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    name?: string;
}

export function DatePicker({ value, onChange, label, placeholder = "Select date", required, name }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedDate = value ? new Date(value) : null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [viewDate]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = getYear(new Date());
    const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

    return (
        <div className="space-y-1 relative" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 bg-white border rounded-lg cursor-pointer transition-all",
                    isOpen ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300"
                )}
            >
                <CalendarIcon size={16} className="text-slate-400" />
                <span className={cn("text-sm flex-1", !value && "text-slate-400")}>
                    {value ? format(new Date(value), "PPP") : placeholder}
                </span>
                <input type="hidden" name={name} value={value || ""} required={required} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-2 top-full left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-[300px] animation-fade-in animate-in fade-in zoom-in-95 duration-200 origin-top">
                    {/* Header: Selectors */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-1">
                            <select 
                                value={getMonth(viewDate)}
                                title="Select Month"
                                aria-label="Select Month"
                                onChange={(e) => setViewDate(setMonth(viewDate, parseInt(e.target.value)))}
                                className="text-xs font-semibold bg-slate-50 border-none rounded px-1 py-0.5 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                            <select 
                                value={getYear(viewDate)}
                                title="Select Year"
                                aria-label="Select Year"
                                onChange={(e) => setViewDate(setYear(viewDate, parseInt(e.target.value)))}
                                className="text-xs font-semibold bg-slate-50 border-none rounded px-1 py-0.5 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                {Array.from({ length: 50 }, (_, i) => currentYear - 20 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                type="button"
                                title="Previous Month"
                                aria-label="Previous Month"
                                onClick={() => setViewDate(subMonths(viewDate, 1))}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                type="button"
                                title="Next Month"
                                aria-label="Next Month"
                                onClick={() => setViewDate(addMonths(viewDate, 1))}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                            const isCurrentMonth = isSameMonth(day, viewDate);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const today = isToday(day);

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        onChange(format(day, 'yyyy-MM-dd'));
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "h-8 w-8 rounded text-xs flex items-center justify-center transition-all",
                                        !isCurrentMonth && "text-slate-300",
                                        isCurrentMonth && "text-slate-700 hover:bg-indigo-50 hover:text-indigo-600",
                                        today && !isSelected && "bg-slate-100 font-bold",
                                        isSelected && "bg-indigo-600 text-white font-bold hover:bg-indigo-700 hover:text-white"
                                    )}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* Footer: Today button */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                        <button 
                            type="button"
                            onClick={() => {
                                const t = new Date();
                                setViewDate(t);
                                onChange(format(t, 'yyyy-MM-dd'));
                                setIsOpen(false);
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wider"
                        >
                            Select Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

