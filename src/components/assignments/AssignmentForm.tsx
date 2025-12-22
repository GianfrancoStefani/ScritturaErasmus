"use client";

import { useFormState, useFormStatus } from "react-dom";
import { assignUser } from "@/app/actions/assignments";
import { Button } from "@/components/ui/Button";
import { useState, useMemo } from "react";
import { Plus, X, Calendar } from "lucide-react";

// Types corresponding to what we pass from list
type PartnerWithUsers = {
  id: string;
  name: string;
  users: {
    id: string;
    name: string;
    surname: string;
    role: string;
  }[];
}

type AssignmentData = {
    id?: string;
    user: { id: string };
    days: number;
    dailyRate: number | null;
    months: string | null;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button disabled={pending} className="w-full">{pending ? "Saving Assignment..." : "Save Assignment"}</Button>;
}

export function AssignmentForm({ 
    taskId, 
    partners, 
    initialData, 
    onClose 
}: { 
    taskId: string; 
    partners: PartnerWithUsers[]; 
    initialData?: AssignmentData; 
    onClose: () => void;
}) {
    const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
    
    // Parse initial months JSON if exists
    const initialMonths = useMemo(() => {
        if (initialData?.months) {
            try { return JSON.parse(initialData.months); } catch { return {}; }
        }
        return {};
    }, [initialData]);

    // State for months selection
    const [monthDays, setMonthDays] = useState<Record<string, number>>(initialMonths);

    // Calculate total days from month breakdown
    const calculatedTotalDays = Object.values(monthDays).reduce((a, b) => a + Number(b), 0);

    const [state, formAction] = useFormState(async (prevState: any, formData: FormData) => {
         // Inject the JSON string for months
         formData.set('months', JSON.stringify(monthDays));
         // Ensure days is set from calc if not manually overridden (we'll enforce calc)
         formData.set('days', calculatedTotalDays.toString());
         
         const result = await assignUser(formData);
         if (result?.success) {
             onClose();
             return { message: "Success" };
         }
         return result;
    }, null);

    // Generate next 24 months for selection options (or based on project dates ideally, but generic for now)
    const availableMonths = useMemo(() => {
        const months = [];
        const date = new Date();
        // Start from current month or project start? 
        // Ideally project duraton. For now, just generic 2 years range from now 
        // or simplistic approach: manual text input for YYYY-MM if needed, but select is better.
        // Let's generate a list from 2024 to 2027.
        for (let y = 2024; y <= 2027; y++) {
            for (let m = 0; m < 12; m++) {
                months.push(`${y}-${String(m + 1).padStart(2, '0')}`);
            }
        }
        return months;
    }, []);

    const toggleMonth = (month: string) => {
        setMonthDays(prev => {
            const next = { ...prev };
            if (next[month] !== undefined) {
                delete next[month];
            } else {
                next[month] = 0; // Initialize with 0 days
            }
            return next;
        });
    };

    const updateMonthDays = (month: string, days: string) => {
        setMonthDays(prev => ({
            ...prev,
            [month]: Number(days)
        }));
    };

    const users = useMemo(() => {
        if (!selectedPartnerId) return [];
        return partners.find(p => p.id === selectedPartnerId)?.users || [];
    }, [selectedPartnerId, partners]);

    // Handle initial user/partner selection
    useMemo(() => {
         if (initialData?.user?.id) {
             const p = partners.find(p => p.users.some(u => u.id === initialData.user.id));
             if (p) setSelectedPartnerId(p.id);
         } else if (partners.length > 0 && !selectedPartnerId) {
             setSelectedPartnerId(partners[0].id);
         }
    }, [initialData, partners]);


    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="taskId" value={taskId} />
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Organization</label>
                    <select 
                        className="w-full border rounded p-2" 
                        value={selectedPartnerId}
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                        disabled={!!initialData} // Disable changing user/partner on edit for simplicity (delete & recreate instead)
                    >
                        {partners.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                     <label className="text-sm font-medium">User</label>
                     <select 
                        name="userId" 
                        className="w-full border rounded p-2"
                        defaultValue={initialData?.user.id}
                        disabled={!!initialData}
                     >
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} {u.surname} ({u.role})</option>
                        ))}
                     </select>
                     {!!initialData && <input type="hidden" name="userId" value={initialData.user.id} />}
                </div>
            </div>
            
            <div className="border-t border-b py-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar size={16} /> 
                    Activity Months & Days
                </h3>
                
                <div className="max-h-48 overflow-y-auto border rounded p-2 grid grid-cols-3 gap-2 bg-slate-50 mb-4">
                    {availableMonths.map(month => (
                        <div 
                            key={month} 
                            onClick={() => toggleMonth(month)}
                            className={`
                                cursor-pointer text-xs p-2 rounded border text-center transition-colors
                                ${monthDays[month] !== undefined 
                                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-bold' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}
                            `}
                        >
                            {month}
                        </div>
                    ))}
                </div>

                {Object.keys(monthDays).length > 0 ? (
                    <div className="space-y-2">
                        <p className="text-xs text-slate-500 font-medium uppercase">Days per selected month:</p>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {Object.keys(monthDays).sort().map(month => (
                                <div key={month} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded border">
                                    <span className="font-medium text-slate-700">{month}</span>
                                    <input 
                                        type="number" 
                                        min="0"
                                        step="0.5"
                                        value={monthDays[month]}
                                        onChange={(e) => updateMonthDays(month, e.target.value)}
                                        className="w-16 border rounded p-1 text-right"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic text-center">Select months above to assign working days.</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Total Days</label>
                    <div className="p-2 bg-slate-100 rounded text-slate-700 font-bold text-center border">
                        {calculatedTotalDays}
                    </div>
                </div>
                 <div className="space-y-1">
                    <label className="text-sm font-medium">Daily Rate (€)</label>
                    <input 
                        name="dailyRate" 
                        type="number" 
                        step="0.01" 
                        className="w-full border rounded p-2" 
                        defaultValue={initialData?.dailyRate || 0}
                    />
                </div>
            </div>
            
            <div className="bg-indigo-50 p-3 rounded text-sm text-indigo-800 flex justify-between">
                <span>Estimated Cost:</span>
                <span className="font-bold">€{(calculatedTotalDays * (Number(initialData?.dailyRate) || 0)).toLocaleString()}</span>
                {/* Note: Realtime calc for cost in render requires state for dailyRate, ignoring for simplicity */}
            </div>

            <div className="text-red-500 text-sm">
                {(state as any)?.error && (typeof (state as any).error === 'string' ? (state as any).error : "Validation error")}
                {(state as any)?.message && (state as any).message}
            </div>

            <div className="pt-2">
                <SubmitButton />
            </div>
        </form>
    );
}
