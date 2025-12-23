"use client";

import { useState } from "react";
import { updateMemberCost } from "@/app/actions/costActions";
import { Button } from "@/components/ui/Button";
import { Edit, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Member {
    id: string;
    role: string;
    projectRole: string | null;
    customDailyRate: number | null;
    user: { name: string, surname: string, email: string };
    partner: { name: string, nation: string };
    effectiveCost: { dailyRate: number, monthlyCost: number, source: string, details?: string } | null;
}

export function ProjectTeamList({ projectId, initialMembers, readOnly = false }: { projectId: string, initialMembers: Member[], readOnly?: boolean }) {
    const [members, setMembers] = useState(initialMembers);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ projectRole: '', customDailyRate: 0 });

    const startEdit = (member: Member) => {
        if (readOnly) return;
        setEditingId(member.id);
        setEditForm({
            projectRole: member.projectRole || '',
            customDailyRate: member.customDailyRate || 0
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async (memberId: string) => {
        try {
            await updateMemberCost(memberId, editForm.customDailyRate > 0 ? editForm.customDailyRate : null, editForm.projectRole);
            toast.success("Member updated");
            setEditingId(null);
            window.location.reload(); 
        } catch (e) {
            toast.error("Update failed");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Partner / Nation</th>
                        <th className="px-4 py-3 font-medium">Role (Job Title)</th>
                        <th className="px-4 py-3 font-medium text-right">Daily Rate</th>
                        <th className="px-4 py-3 font-medium text-right">Est. Monthly</th>
                        {!readOnly && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {members.map(member => (
                        <tr key={member.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                                <div className="font-semibold text-slate-700">{member.user.name} {member.user.surname}</div>
                                <div className="text-xs text-slate-400">{member.user.email}</div>
                            </td>
                            <td className="px-4 py-3">
                                <div>{member.partner.name}</div>
                                <div className="text-xs font-mono bg-slate-100 inline-block px-1 rounded">{member.partner.nation}</div>
                            </td>
                            <td className="px-4 py-3">
                                {editingId === member.id ? (
                                    <input 
                                        className="border rounded p-1 w-full text-sm"
                                        value={editForm.projectRole}
                                        onChange={e => setEditForm({...editForm, projectRole: e.target.value})}
                                        placeholder={member.role}
                                        aria-label="Job Title"
                                    />
                                ) : (
                                    <span className={!member.projectRole ? "text-slate-400 italic" : ""}>
                                        {member.projectRole || member.role}
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-right">
                                {editingId === member.id ? (
                                    <input 
                                        type="number"
                                        className="border rounded p-1 w-20 text-right text-sm"
                                        value={editForm.customDailyRate}
                                        onChange={e => setEditForm({...editForm, customDailyRate: parseFloat(e.target.value)})}
                                        aria-label="Daily Rate"
                                    />
                                ) : (
                                    <div>
                                        <div className="font-mono text-indigo-600 font-bold">
                                            € {member.effectiveCost?.dailyRate.toFixed(2)}
                                        </div>
                                        {member.effectiveCost?.source === 'STANDARD' && (
                                            <div className="text-[10px] text-green-600">Standard Grid</div>
                                        )}
                                        {member.effectiveCost?.source === 'CUSTOM' && (
                                            <div className="text-[10px] text-amber-600 font-semibold">Overridden</div>
                                        )}
                                    </div>
                                )}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500">
                                € {member.effectiveCost?.monthlyCost.toFixed(0)}
                            </td>
                            {!readOnly && (
                                <td className="px-4 py-3 text-right">
                                    {editingId === member.id ? (
                                        <div className="flex justify-end gap-1">
                                            <Button size="sm" onClick={() => saveEdit(member.id)} title="Save"><Save size={14} /></Button>
                                            <Button size="sm" variant="secondary" onClick={cancelEdit} title="Cancel"><X size={14} /></Button>
                                        </div>
                                    ) : (
                                        <button onClick={() => startEdit(member)} className="text-slate-400 hover:text-indigo-600" title="Edit Cost">
                                            <Edit size={16} />
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
