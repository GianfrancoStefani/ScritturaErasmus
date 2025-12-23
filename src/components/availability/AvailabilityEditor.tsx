"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { saveAvailability } from "@/app/actions/availabilityActions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AvailabilityEditorProps {
    availabilities: any[]; // List of UserAvailability
}

const MONTHS = [
    { key: "daysJan", label: "January", max: 31 },
    { key: "daysFeb", label: "February", max: 29 }, // Leap year logic handled generically or max 29
    { key: "daysMar", label: "March", max: 31 },
    { key: "daysApr", label: "April", max: 30 },
    { key: "daysMay", label: "May", max: 31 },
    { key: "daysJun", label: "June", max: 30 },
    { key: "daysJul", label: "July", max: 31 },
    { key: "daysAug", label: "August", max: 31 },
    { key: "daysSep", label: "September", max: 30 },
    { key: "daysOct", label: "October", max: 31 },
    { key: "daysNov", label: "November", max: 30 },
    { key: "daysDec", label: "December", max: 31 },
];

export function AvailabilityEditor({ availabilities }: AvailabilityEditorProps) {
    const currentYearDate = new Date().getFullYear();
    const [year, setYear] = useState(currentYearDate);
    const [formData, setFormData] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Load data when year or availabilities change
    useEffect(() => {
        const data = availabilities.find(a => a.year === year);
        const defaults: Record<string, number> = {};
        MONTHS.forEach(m => defaults[m.key] = 0);

        if (data) {
            MONTHS.forEach(m => {
                if (data[m.key] !== undefined) defaults[m.key] = data[m.key];
            });
        }
        setFormData(defaults);
    }, [year, availabilities]);

    const handleChange = (key: string, value: string) => {
        const num = parseInt(value) || 0;
        setFormData(prev => ({ ...prev, [key]: num }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveAvailability(year, formData);
            toast.success(`Availability for ${year} saved.`);
        } catch (error) {
            toast.error("Failed to save availability.");
        } finally {
            setIsSaving(false);
        }
    };

    const totalDays = Object.values(formData).reduce((a, b) => a + b, 0);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-lg font-bold text-slate-800">Availability</h3>
                   <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => setYear(y => y-1)} className="p-1 hover:bg-slate-100 rounded">
                            &larr;
                        </button>
                        <span className="font-mono text-lg font-bold text-indigo-600">{year}</span>
                        <button onClick={() => setYear(y => y+1)} className="p-1 hover:bg-slate-100 rounded">
                            &rarr;
                        </button>
                   </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Total Annual Capacity</p>
                    <p className="text-2xl font-bold text-indigo-600">{totalDays} <span className="text-xs text-slate-400 font-normal">days</span></p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {MONTHS.map(month => (
                    <div key={month.key} className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">{month.label}</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                min="0" 
                                max={month.max}
                                value={formData[month.key] || 0}
                                onChange={(e) => handleChange(month.key, e.target.value)}
                                className="w-full border border-slate-200 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                aria-label={`${month.label} days`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">/ {month.max}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save {year} Changes
                </Button>
            </div>
        </div>
    );
}
