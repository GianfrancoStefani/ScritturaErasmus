"use client";

import { useState } from "react";
import { getAllProjects, getProjectMembers } from "@/app/actions/project"; 
import { inviteUser, updateMemberPermissions } from "@/app/actions/user-management";
import { ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { User, Shield, Mail, Edit, MoreHorizontal, Settings } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import clsx from "clsx";

export default function TeamDashboard({ params }: { params: { id: string } }) {
    return (
        <div className="p-8 max-w-6xl mx-auto">
             <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Team Management</h1>
                    <p className="text-slate-500">Manage partners, roles, and permissions.</p>
                </div>
                <InviteButton projectId={params.id} />
             </header>

             <TeamList projectId={params.id} />
        </div>
    );
}

function InviteButton({ projectId }: { projectId: string }) {
    return (
        <Button>
            <Mail size={16} className="mr-2" /> Invite New Member
        </Button>
    );
}

import { useEffect } from "react";

function TeamList({ projectId }: { projectId: string }) {
    const [members, setMembers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]); // For Tabs
    const [loading, setLoading] = useState(true);

    const load = async () => {
        const [membersRes, projectsRes] = await Promise.all([
            getProjectMembers(projectId),
            getAllProjects()
        ]);
        setMembers(membersRes);
        setProjects(projectsRes);
        setLoading(false);
    };

    useEffect(() => { load(); }, [projectId]);

    if (loading) return <div>Loading team...</div>;

    return (
        <div className="space-y-6">
            {/* PROJECT TABS */}
            {projects.length > 1 && (
                 <div className="border-b border-slate-200">
                     <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                         {projects.map((proj) => (
                             <Link
                                 key={proj.id}
                                 href={`/dashboard/projects/${proj.id}/team`}
                                 title={proj.title}
                                 className={clsx(
                                     proj.id === projectId
                                         ? 'border-indigo-500 text-indigo-600'
                                         : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
                                     'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2'
                                 )}
                             >
                                 <span className={clsx("w-2 h-2 rounded-full", proj.id === projectId ? "bg-indigo-600" : "bg-slate-300")} />
                                 {proj.acronym || proj.title}
                             </Link>
                         ))}
                     </nav>
                 </div>
             )}

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
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold overflow-hidden">
                        {member.user.photo && (member.user.photo.startsWith('http') || member.user.photo.startsWith('/')) && /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(member.user.photo) ? (
                             <img src={member.user.photo} alt={member.user.name} className="w-full h-full object-cover" />
                        ) : (
                            <>{member.user.name[0]}{member.user.surname[0]}</>
                        )}
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
