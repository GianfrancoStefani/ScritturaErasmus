"use client";

import { useState, useEffect } from "react";
import { getProjectMembers } from "@/app/actions/project";
import { assignUserToTask, removeAssignment, getTaskAssignments } from "@/app/actions/tasks";
import { checkWorkloadAction } from "@/app/actions/workloadActions"; 
import { Loader2, AlertTriangle, Trash2, Plus, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

interface TaskAssignmentsProps {
    taskId: string;
    projectId: string;
}

export function TaskAssignments({ taskId, projectId }: TaskAssignmentsProps) {
    const [members, setMembers] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedUser, setSelectedUser] = useState("");
    const [days, setDays] = useState(0);
    const [months, setMonths] = useState<string[]>([]);
    
    // Quick Months Helper (e.g. 2025-01 to 2025-12)
    const availableMonths = [
        "2025-01", "2025-02", "2025-03", "2025-04", 
        "2025-05", "2025-06", "2025-07", "2025-08",
        "2025-09", "2025-10", "2025-11", "2025-12"
    ];

    useEffect(() => {
        loadData();
    }, [taskId, projectId]);

    async function loadData() {
        setLoading(true);
        const [m, a] = await Promise.all([
            getProjectMembers(projectId),
            getTaskAssignments(taskId)
        ]);
        setMembers(m);
        setAssignments(a);
        setLoading(false);
    }

    async function handleAdd() {
        if (!selectedUser || days <= 0 || months.length === 0) return;
        await assignUserToTask(taskId, selectedUser, days, months);
        toast.success("Assigned");
        setDays(0);
        setMonths([]);
        setSelectedUser("");
        loadData();
    }

    async function handleRemove(id: string) {
        if(!confirm("Remove assignment?")) return;
        await removeAssignment(id);
        loadData();
    }

    return (
        <div className="border rounded-lg p-4 bg-slate-50 mt-4">
            <h4 className="font-semibold text-sm mb-4 text-slate-700">Team Assignments & Workload</h4>
            
            {loading ? <Loader2 className="animate-spin" /> : (
                <div className="space-y-4">
                    {/* List */}
                    <div className="space-y-2">
                        {assignments.map(a => (
                            <AssignmentRow key={a.id} assignment={a} onDelete={() => handleRemove(a.id)} />
                        ))}
                        {assignments.length === 0 && <p className="text-xs text-slate-400 italic">No members assigned.</p>}
                    </div>

                    {/* Add Form */}
                            <div className="pt-4 border-t border-slate-200 grid gap-4 bg-white p-4 rounded border border-slate-100 shadow-sm">
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs font-bold text-slate-500">Member</label>
                                 <select 
                                    className="w-full border rounded p-1 text-sm" 
                                    value={selectedUser} 
                                    onChange={e => setSelectedUser(e.target.value)}
                                    aria-label="Select Member"
                                >
                                     <option value="">Select Member...</option>
                                     {members.map(m => (
                                         <option key={m.user.id} value={m.user.id}>{m.user.surname} {m.user.name}</option>
                                     ))}
                                 </select>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500">Total Days</label>
                                 <input 
                                    type="number" 
                                    className="w-full border rounded p-1 text-sm" 
                                    value={days} 
                                    onChange={e => setDays(parseFloat(e.target.value))}
                                    aria-label="Total Days"
                                    placeholder="0"
                                />
                             </div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 mb-1 block">Active Months</label>
                             <div className="flex flex-wrap gap-1">
                                 {availableMonths.map(m => (
                                     <button 
                                        key={m} 
                                        type="button"
                                        onClick={() => setMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                                        className={`px-2 py-1 text-xs rounded border ${months.includes(m) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                     >
                                         {m}
                                     </button>
                                 ))}
                             </div>
                         </div>
                         <Button size="sm" onClick={handleAdd} disabled={!selectedUser || days <= 0 || months.length === 0}>
                             <Plus size={14} className="mr-2" /> Assign Member
                         </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function AssignmentRow({ assignment, onDelete }: { assignment: any, onDelete: () => void }) {
    const [workload, setWorkload] = useState<any>(null);

    useEffect(() => {
        if (assignment.months && assignment.userId) {
             try {
                 const ms = JSON.parse(assignment.months);
                 if (ms.length > 0) {
                     // Check load for the first active month as a sample
                     const [year, month] = ms[0].split('-').map(Number);
                     checkWorkloadAction(assignment.userId, month, year).then(setWorkload);
                 }
             } catch(e) {}
        }
    }, [assignment]);

    return (
        <div className="flex items-center justify-between bg-white p-3 rounded border shadow-sm">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                    {assignment.user?.name?.[0]}{assignment.user?.surname?.[0]}
                </div>
                <div>
                     <div className="text-sm font-bold text-slate-700">{assignment.user?.surname} {assignment.user?.name}</div>
                     <div className="text-xs text-slate-500 flex items-center gap-2">
                         <span>{assignment.days} days</span>
                         <span className="text-slate-300">|</span>
                         <span>{JSON.parse(assignment.months || '[]').length} months</span>
                     </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {workload && (
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${
                        workload.status === 'OVERLOAD' ? 'bg-red-50 text-red-700 border border-red-200' :
                        workload.status === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        workload.status === 'NO_CAPACITY' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                        {workload.percentage.toFixed(0)}% Load
                        {workload.status === 'OVERLOAD' && <Ban size={12} />}
                        {workload.status === 'NO_CAPACITY' && <Ban size={12} />}
                        {workload.status === 'WARNING' && <AlertTriangle size={12} />}
                    </div>
                )}
                <button 
                    onClick={onDelete} 
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete Assignment"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
