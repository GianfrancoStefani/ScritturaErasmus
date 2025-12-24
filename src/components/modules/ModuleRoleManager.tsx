"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { getAssignmentCandidates, updateModuleMembers, getModuleMembers } from "@/app/actions/module-members"
import { User, Check, AlertCircle, Loader2, Settings, FileSignature, Briefcase } from "lucide-react"

interface ModuleRoleManagerProps {
    moduleId: string
    isOpen: boolean
    onClose: () => void
}

type Role = "SUPERVISOR" | "LEADER" | "EDITOR" | "VIEWER"

interface CandidateUser {
    id: string
    name: string
    surname: string
    email: string
    photo?: string | null
    role?: string // Global role
}

interface CandidatePartner {
    id: string
    name: string
    users: CandidateUser[]
}

interface MemberState {
    userId: string
    role: Role
    isWriter: boolean
    isGrantPerson: boolean
    grantTitle: string
}

export function ModuleRoleManager({ moduleId, isOpen, onClose }: ModuleRoleManagerProps) {
    const [loading, setLoading] = useState(false)
    const [partners, setPartners] = useState<CandidatePartner[]>([])
    const [assignedMembers, setAssignedMembers] = useState<MemberState[]>([])
    const [selectedPartnerId, setSelectedPartnerId] = useState<string>("")
    const [error, setError] = useState("")
    const [expandedUser, setExpandedUser] = useState<string | null>(null) // For detail view

    useEffect(() => {
        if (isOpen) {
            loadData()
        }
    }, [isOpen, moduleId])

    async function loadData() {
        setLoading(true)
        setError("")
        try {
            const [candRes, memRes] = await Promise.all([
                getAssignmentCandidates(moduleId),
                getModuleMembers(moduleId)
            ])

            if (candRes.success && candRes.data) {
                setPartners(candRes.data)
                
                // Prioritize Lead Partner, then current selection, then first in list
                if ((candRes as any).leadPartnerId) {
                     setSelectedPartnerId((candRes as any).leadPartnerId)
                } else if (candRes.data.length > 0 && !selectedPartnerId) {
                    setSelectedPartnerId(candRes.data[0].id)
                }
            } else {
                setError(candRes.error || "Failed to load partners")
            }

            if (memRes.success && memRes.data) {
                setAssignedMembers(memRes.data.map((m: any) => ({
                    userId: m.userId,
                    role: m.role as Role,
                    isWriter: m.isWriter ?? true,
                    isGrantPerson: m.isGrantPerson ?? false,
                    grantTitle: m.grantTitle || ""
                })))
            } else {
                setError(memRes.error || "Failed to load members")
            }

        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = (userId: string, role: Role) => {
        setAssignedMembers(prev => {
            const existing = prev.find(p => p.userId === userId)
            if (existing && existing.role === role) {
                // Remove existing entry for this user
                 return prev.filter(p => p.userId !== userId)
            }
            
            // Update or Add
            if (existing) {
                return prev.map(p => p.userId === userId ? { ...p, role } : p)
            } else {
                return [...prev, { userId, role, isWriter: true, isGrantPerson: false, grantTitle: "" }]
            }
        })
    }

    const updateMemberDetail = (userId: string, field: keyof MemberState, value: any) => {
        setAssignedMembers(prev => prev.map(p => p.userId === userId ? { ...p, [field]: value } : p))
    }
    
    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await updateModuleMembers(moduleId, assignedMembers)
            if (res.success) {
               onClose()
            } else {
                setError(res.error || "Failed to save")
            }
        } catch (err) {
             setError("Failed to save")
        } finally {
            setLoading(false)
        }
    }

    const selectedPartner = partners.find(p => p.id === selectedPartnerId)

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Module Team & Roles">
            <div className="flex flex-col h-[650px] w-[900px] relative">
                 {loading && (
                    <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Partner Tabs */}
                <div className="flex overflow-x-auto border-b mb-4 pb-1 gap-2 custom-scrollbar">
                    {partners.map(partner => (
                        <button
                            key={partner.id}
                            onClick={() => setSelectedPartnerId(partner.id)}
                            className={`px-3 py-2 text-xs font-medium whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${
                                selectedPartnerId === partner.id
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-600"
                                    : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            {partner.name}
                        </button>
                    ))}
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto">
                    {selectedPartner ? (
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 border-b">Member</th>
                                    <th className="px-2 py-3 border-b text-center text-indigo-600" title="Scientific Coordinator / Lead">Supervisor</th>
                                    <th className="px-2 py-3 border-b text-center text-emerald-600" title="Operational Leader">Leader</th>
                                    <th className="px-2 py-3 border-b text-center text-blue-600" title="Content Creator">Editor</th>
                                    <th className="px-2 py-3 border-b text-center text-slate-600" title="Read Only">Viewer</th>
                                    <th className="px-2 py-3 border-b w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedPartner.users.map(user => {
                                    const assignment = assignedMembers.find(m => m.userId === user.id)
                                    const currentRole = assignment?.role
                                    const isExpanded = expandedUser === user.id

                                    return (
                                        <>
                                        <tr key={user.id} className={`border-b ${assignment ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                                            <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                    {user.name[0]}{user.surname[0]}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{user.surname} {user.name}</div>
                                                    <div className="text-[10px] text-slate-400">{user.email}</div>
                                                </div>
                                            </td>
                                            {(["SUPERVISOR", "LEADER", "EDITOR", "VIEWER"] as Role[]).map(role => (
                                                <td key={role} className="px-2 py-3 text-center">
                                                    <button
                                                        onClick={() => handleRoleChange(user.id, role)}
                                                        title={`Assign ${role} role to ${user.name}`}
                                                        aria-label={`Assign ${role} role to ${user.name}`}
                                                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all mx-auto ${
                                                            currentRole === role
                                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm scale-110"
                                                                : "bg-white border-slate-200 text-transparent hover:border-indigo-300"
                                                        }`}
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                </td>
                                            ))}
                                            <td className="px-2 py-3 text-center">
                                                {assignment && (
                                                    <button 
                                                        onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                                        className={`p-1.5 rounded transition-colors ${isExpanded ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                                                        title="Advanced Settings"
                                                    >
                                                        <Settings size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {/* Detail Row */}
                                        {isExpanded && assignment && (
                                            <tr className="bg-slate-50 shadow-inner">
                                                <td colSpan={6} className="px-4 py-4">
                                                    <div className="flex gap-8 items-start px-8">
                                                        {/* Writer Access */}
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                                <FileSignature size={14} /> Platform Access
                                                            </span>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                                    checked={assignment.isWriter}
                                                                    onChange={(e) => updateMemberDetail(user.id, 'isWriter', e.target.checked)}
                                                                />
                                                                <span className="text-sm text-slate-700">Can Edit Content (Writer)</span>
                                                            </label>
                                                            <p className="text-[10px] text-slate-400 max-w-[200px]">
                                                                If unchecked, user can only View or Comment despite having an Editor role.
                                                            </p>
                                                        </div>

                                                        {/* Divider */}
                                                        <div className="w-px h-16 bg-slate-200"></div>

                                                        {/* Grant Execution */}
                                                        <div className="flex flex-col gap-2 flex-1">
                                                             <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                                <Briefcase size={14} /> Official Grant Role
                                                            </span>
                                                            <div className="flex items-center gap-4">
                                                                 <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                        checked={assignment.isGrantPerson}
                                                                        onChange={(e) => updateMemberDetail(user.id, 'isGrantPerson', e.target.checked)}
                                                                    />
                                                                    <span className="text-sm text-slate-700">Listed in Grant Agreement</span>
                                                                </label>
                                                                {assignment.isGrantPerson && (
                                                                     <div className="flex-1">
                                                                         <input 
                                                                            type="text" 
                                                                            placeholder="Official Title (e.g. Senior Researcher)"
                                                                            className="w-full text-xs p-1.5 border border-slate-300 rounded focus:border-indigo-500 outline-none"
                                                                            value={assignment.grantTitle}
                                                                            onChange={(e) => updateMemberDetail(user.id, 'grantTitle', e.target.value)}
                                                                         />
                                                                     </div>
                                                                )}
                                                            </div>
                                                             <p className="text-[10px] text-slate-400">
                                                                Enable this if this person should appear in the generated PDF/Grant Agreement tables, even if they don't use the app.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </>
                                    )
                                })}
                                {selectedPartner.users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                            No users found for this partner.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Briefcase size={40} className="mb-2 opacity-20" />
                            <p>Select a partner to manage team members.</p>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-400">
                        * Grant Roles are exported to PDF. Platform Access controls app permissions.
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
