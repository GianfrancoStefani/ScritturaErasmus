"use client";

import { useState } from "react";
import { format } from "date-fns";
import { User, Tag, Trash2, Edit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button"; // Check path
import { Modal } from "@/components/ui/Modal";
import { AssignmentForm } from "./AssignmentForm";
import { deleteAssignment } from "@/app/actions/assignments";

// Types
type AssignmentWithUser = {
  id: string;
  user: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
  days: number;
  dailyRate: number | null;
  months: string | null; // JSON
}

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

export function AssignmentList({ 
    assignments, 
    partners, 
    taskId,
    projectId 
}: { 
    assignments: AssignmentWithUser[], 
    partners: PartnerWithUsers[], 
    taskId: string,
    projectId: string
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<AssignmentWithUser | undefined>(undefined);

    const handleEdit = (assignment: AssignmentWithUser) => {
        setEditingAssignment(assignment);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingAssignment(undefined);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to remove this assignment?")) {
            await deleteAssignment(id, projectId);
        }
    };

    const totalDays = assignments.reduce((acc, curr) => acc + curr.days, 0);
    const totalCost = assignments.reduce((acc, curr) => acc + (curr.days * (curr.dailyRate || 0)), 0);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                     <h2 className="text-xl font-semibold text-slate-800">Assignments</h2>
                     <p className="text-sm text-slate-500">
                        {totalDays} days total • €{totalCost.toLocaleString()} estimated cost
                     </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus size={16} className="mr-2" /> Assign User
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {assignments.map(assignment => (
                    <div key={assignment.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800">{assignment.user.name} {assignment.user.surname}</p>
                                <div className="text-xs text-slate-500 flex gap-2">
                                    <span>{assignment.days} days</span>
                                    {assignment.dailyRate && <span>• Rate: €{assignment.dailyRate}/day</span>}
                                    {assignment.dailyRate && <span>• Total: €{(assignment.days * assignment.dailyRate).toLocaleString()}</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(assignment)} className="p-2 text-slate-400 hover:text-indigo-600">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(assignment.id)} className="p-2 text-slate-400 hover:text-red-600">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {assignments.length === 0 && (
                    <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">No users assigned to this task yet.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingAssignment ? "Edit Assignment" : "Assign User"}>
                <AssignmentForm 
                    taskId={taskId} 
                    partners={partners} 
                    initialData={editingAssignment} 
                    onClose={() => setIsFormOpen(false)} 
                />
            </Modal>
        </div>
    );
}
