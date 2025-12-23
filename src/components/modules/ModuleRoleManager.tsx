"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { getAssignmentCandidates, updateModuleMembers, getModuleMembers } from "@/app/actions/module-members"
import { User, Check, AlertCircle, Loader2 } from "lucide-react"

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
}

export function ModuleRoleManager({ moduleId, isOpen, onClose }: ModuleRoleManagerProps) {
    const [loading, setLoading] = useState(false)
    const [partners, setPartners] = useState<CandidatePartner[]>([])
    const [assignedMembers, setAssignedMembers] = useState<MemberState[]>([])
    const [selectedPartnerId, setSelectedPartnerId] = useState<string>("")
    const [error, setError] = useState("")

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
                if (candRes.data.length > 0 && !selectedPartnerId) {
                    setSelectedPartnerId(candRes.data[0].id)
                }
            } else {
                setError(candRes.error || "Failed to load partners")
            }

            if (memRes.success && memRes.data) {
                setAssignedMembers(memRes.data.map((m: any) => ({
                    userId: m.userId,
                    role: m.role as Role
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
                // Toggle off if clicking same role? Or remove user?
                // Let's allow removing by clicking active role or separate remove button.
                // For now, toggle off.
                return prev.filter(p => p.userId !== userId)
            }
            
            // Remove existing entry for this user and add new one
            const filtered = prev.filter(p => p.userId !== userId)
            return [...filtered, { userId, role }]
        })
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
        <Modal isOpen={isOpen} onClose={onClose} title="Gestione Ruoli Modulo">
            <div className="flex flex-col h-[600px] w-[800px] relative">
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
                <div className="flex overflow-x-auto border-b mb-4 pb-1 gap-2">
                    {partners.map(partner => (
                        <button
                            key={partner.id}
                            onClick={() => setSelectedPartnerId(partner.id)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-md transition-colors ${
                                selectedPartnerId === partner.id
                                    ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            {partner.name}
                        </button>
                    ))}
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto">
                    {selectedPartner ? (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Utente</th>
                                    <th className="px-4 py-3 text-center text-xs text-indigo-600">Supervisor</th>
                                    <th className="px-4 py-3 text-center text-xs text-emerald-600">Leader</th>
                                    <th className="px-4 py-3 text-center text-xs text-blue-600">Editor</th>
                                    <th className="px-4 py-3 text-center text-xs text-gray-600">Viewer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedPartner.users.map(user => {
                                    const assignment = assignedMembers.find(m => m.userId === user.id)
                                    const currentRole = assignment?.role

                                    return (
                                        <tr key={user.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                    {user.name[0]}{user.surname[0]}
                                                </div>
                                                <div>
                                                    <div>{user.name} {user.surname}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </td>
                                            {(["SUPERVISOR", "LEADER", "EDITOR", "VIEWER"] as Role[]).map(role => (
                                                <td key={role} className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleRoleChange(user.id, role)}
                                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mx-auto ${
                                                            currentRole === role
                                                                ? "bg-blue-600 border-blue-600 text-white"
                                                                : "border-gray-300 hover:border-blue-400"
                                                        }`}
                                                    >
                                                        {currentRole === role && <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                </td>
                                            ))}
                                        </tr>
                                    )
                                })}
                                {selectedPartner.users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                            Nessun utente trovato per questo partner.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-10 text-gray-500">Seleziona un partner per visualizzare gli utenti.</div>
                    )}
                </div>

                <div className="mt-4 flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={loading}>Annulla</Button>
                    <Button onClick={handleSave} disabled={loading}>Salva Modifiche</Button>
                </div>
            </div>
        </Modal>
    )
}
