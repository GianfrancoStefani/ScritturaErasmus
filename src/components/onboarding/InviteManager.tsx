"use client";

import { useState, useEffect } from "react";
import { createInvitation, deleteInvitation, getProjectInvitations } from "@/app/actions/invitations";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, Mail, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
    id: string;
    email: string;
    status: string;
    expiresAt: Date;
}

export function InviteManager({ projectId }: { projectId: string }) {
    const [email, setEmail] = useState("");
    const [invites, setInvites] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadInvites();
    }, [projectId]);

    async function loadInvites() {
        const data = await getProjectInvitations(projectId);
        setInvites(data);
    }

    async function handleInvite() {
        if (!email.includes("@")) return;
        setLoading(true);
        const res = await createInvitation(projectId, email);
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Invitation sent");
            setEmail("");
            loadInvites();
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Revoke invitation?")) return;
        await deleteInvitation(id, projectId);
        loadInvites();
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Mail size={20} className="text-indigo-600" />
                Invite Members
            </h3>

            <div className="flex gap-2 mb-6">
                <input 
                    type="email" 
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                />
                <Button onClick={handleInvite} disabled={loading || !email}>
                    {loading ? <Loader2 className="animate-spin" /> : <Plus size={18} className="mr-2" />}
                    Send Invite
                </Button>
            </div>

            {invites.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending Invitations</h4>
                    <ul className="divide-y divide-slate-100">
                        {invites.map(invite => (
                            <li key={invite.id} className="py-3 flex justify-between items-center group">
                                <div>
                                    <div className="text-sm font-medium text-slate-700">{invite.email}</div>
                                    <div className="text-xs text-slate-400">
                                        Status: <span className="font-mono text-amber-600">{invite.status}</span>
                                        <span className="mx-2">•</span>
                                        Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(invite.id)}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                    title="Revoke Invitation"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
