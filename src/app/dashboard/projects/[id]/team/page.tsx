"use client";

import { useState } from "react";
import { getProjectMembers } from "@/app/actions/project"; 
import { inviteUser, updateMemberPermissions, ROLES } from "@/app/actions/user-management";
import { Button } from "@/components/ui/Button";
import { User, Shield, Mail, Edit, MoreHorizontal, Settings } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function TeamDashboard({ params }: { params: { id: string } }) {
    // Note: In real app, we fetch initial data via RSC. For client component simplicity here:
    // We assume data is passed or fetched. Let's make this page fetch in useEffect or convert to Server Component.
    // For now, I will write it as a Server Component that uses Client Components for interactivity.
    // But since I don't have easy file separation within one tool call, I'll write a Client Component structure 
    // that fetches data on mount for simplicity in prototype, or pure Server Component if possible.
    // Let's do Server Component + Client List.
    
    return (
        <div className="p-8 max-w-6xl mx-auto">
             <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Team Management</h1>
                    <p className="text-slate-500">Manage partners, roles, and permissions.</p>
                </div>
                {/* Invite Button would open a Modal */}
                <InviteButton projectId={params.id} />
             </header>

             <TeamList projectId={params.id} />
        </div>
    );
}

function InviteButton({ projectId }: { projectId: string }) {
    // This would ideally overlap a Dialog. For brevity, generic button.
    return (
        <Button>
            <Mail size={16} className="mr-2" /> Invite New Member
        </Button>
    );
}

import { useEffect } from "react";

function TeamList({ projectId }: { projectId: string }) {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        const res = await getProjectMembers(projectId);
        setMembers(res);
        setLoading(false);
    };

    useEffect(() => { load(); }, [projectId]);

    if (loading) return <div>Loading team...</div>;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 font-bold text-slate-600">User</th>
                        <th className="p-4 font-bold text-slate-600">Partner</th>
                        <th className="p-4 font-bold text-slate-600">Roles</th>
                        <th className="p-4 font-bold text-slate-600 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {members.map(m => (
                        <MemberRow key={m.id} member={m} projectId={projectId} onUpdate={load} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function MemberRow({ member, projectId, onUpdate }: { member: any, projectId: string, onUpdate: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(member.roles || []);
    
    // Available Roles List
    const roleOptions = Object.values(ROLES);

    const handleSave = async () => {
        await updateMemberPermissions(member.id, projectId, selectedRoles);
        setIsEditing(false);
        toast.success("Roles updated");
        onUpdate();
    };

    const toggleRole = (role: string) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    return (
        <tr className="hover:bg-slate-50/50">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {member.user.name[0]}{member.user.surname[0]}
                    </div>
                    <div>
                        <div className="font-bold text-slate-800">{member.user.name} {member.user.surname}</div>
                        <div className="text-xs text-slate-400">{member.user.email}</div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                    {member.partner.name}
                </span>
            </td>
            <td className="p-4">
                {isEditing ? (
                    <div className="flex flex-wrap gap-2 max-w-md">
                        {roleOptions.map(role => (
                            <button
                                key={role}
                                onClick={() => toggleRole(role)}
                                className={`px-2 py-1 text-xs rounded border ${selectedRoles.includes(role) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                {role}
                            </button>
                        ))}
                        <div className="w-full mt-2 flex gap-2">
                             <Button size="sm" onClick={handleSave}>Save</Button>
                             <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-1">
                        {member.roles?.map((r: string) => (
                            <span key={r} className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                r === 'PROJECT_MANAGER' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                                {r.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                )}
            </td>
            <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                    {!isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Edit Permissions"
                        >
                            <Shield size={16} />
                        </button>
                    )}
                    <Link href={`/dashboard/projects/${projectId}/team/${member.id}`}>
                        <button 
                            className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Manage Profile & Workload"
                        >
                            <Settings size={16} />
                        </button>
                    </Link>
                </div>
            </td>
        </tr>
    );
}
