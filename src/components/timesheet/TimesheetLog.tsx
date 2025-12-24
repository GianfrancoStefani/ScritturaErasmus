"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { logTime } from "@/app/actions/timesheets";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";

interface TimesheetLogProps {
    project: any;
    currentUser: any;
}

export function TimesheetLog({ project, currentUser }: TimesheetLogProps) {
    const [loading, setLoading] = useState(false);
    const [hours, setHours] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState("");
    
    // Quick Selection (Simplified: Just selects general project work for now, 
    // real app needs cascading dropdown Work -> Task -> Activity)
    // For MVP, we log to Project level or allow optional granularity if passed.
    
    const handleLog = async () => {
        if (!hours || isNaN(Number(hours))) {
            toast.error("Invalid hours");
            return;
        }

        setLoading(true);
        try {
            const res = await logTime({
                projectId: project.id,
                userId: currentUser.id,
                date: new Date(date),
                hours: Number(hours),
                description,
                // workId: ... 
            });
            
            if (res.success) {
                toast.success("Time logged!");
                setHours("");
                setDescription("");
            } else {
                toast.error("Failed to log time");
            }
        } catch(e) {
            toast.error("Error logging time");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-indigo-600" /> Log Time (Quick Add)
            </h3>
            
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                    />
                    <Input 
                        type="number" 
                        placeholder="Hours (e.g. 4)" 
                        value={hours}
                        onChange={e => setHours(e.target.value)}
                        min={0}
                        max={24}
                    />
                </div>
                <Input 
                    placeholder="Description (Optional)" 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
                
                <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleLog}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Time"}
                </Button>
            </div>
        </div>
    );
}
