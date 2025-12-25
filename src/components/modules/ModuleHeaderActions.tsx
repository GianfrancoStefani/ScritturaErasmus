"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { ModuleRoleManager } from "@/components/modules/ModuleRoleManager" // Assuming it is exported
import { authorizeModule, validateModule } from "@/app/actions/module-workflow"
import { Users, CheckCircle, ShieldCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ModuleHeaderActionsProps {
    moduleId: string
    currentStatus: string
    userRole: string | null // SUPERVISOR, LEADER, EDITOR, VIEWER, or null
    isManager: boolean
    userId: string
    completionPercentage: number
}

export function ModuleHeaderActions({ moduleId, currentStatus, userRole, isManager, userId, completionPercentage }: ModuleHeaderActionsProps) {
    const router = useRouter()
    const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false)
    const [loadingAction, setLoadingAction] = useState<string | null>(null)

    const handleAuthorize = async () => {
        setLoadingAction("authorize")
        try {
            const res = await authorizeModule(moduleId, userId)
            if (res.success) {
                toast.success("Module Authorized")
                router.refresh()
            } else {
                toast.error(res.error || "Failed to authorize")
            }
        } catch (err) {
            toast.error("Failed to authorize")
        } finally {
            setLoadingAction(null)
        }
    }

    const handleValidate = async () => {
        setLoadingAction("validate")
        try {
            const res = await validateModule(moduleId, userId)
            if (res.success) {
                toast.success("Module Validated")
                router.refresh()
            } else {
                toast.error(res.error || "Failed to validate")
            }
        } catch (err) {
            toast.error("Failed to validate")
        } finally {
            setLoadingAction(null)
        }
    }

    const canAuthorize = userRole === "LEADER" && (currentStatus === "DONE" || currentStatus === "UNDER_REVIEW")
    const canValidate = userRole === "SUPERVISOR" && currentStatus === "AUTHORIZED"

    // Only Supervisor or Manager (Admin) can manage roles? Or Leader too?
    // Let's allow Supervisor, Leader, and Managers.
    const canManageRoles = isManager || userRole === "SUPERVISOR" || userRole === "LEADER"

    return (
        <div className="flex items-center gap-3">
            {/* Status Badge */}
            <StatusBadge status={currentStatus} />
            <CompletionBadge percentage={completionPercentage} />

            {/* Workflow Actions */}
            {canAuthorize && (
                <Button 
                    size="sm" 
                    onClick={handleAuthorize} 
                    disabled={!!loadingAction}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex"
                >
                    {loadingAction === "authorize" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Authorize
                </Button>
            )}

            {canValidate && (
                <Button 
                    size="sm" 
                    onClick={handleValidate} 
                    disabled={!!loadingAction}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 flex"
                >
                    {loadingAction === "validate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Validate
                </Button>
            )}

            {/* Role Manager Toggle */}
            {canManageRoles && (
                <>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsRoleManagerOpen(true)}
                        className="gap-2 flex"
                    >
                        <Users className="w-4 h-4" />
                        Roles
                    </Button>
                    <ModuleRoleManager 
                        moduleId={moduleId}
                        isOpen={isRoleManagerOpen}
                        onClose={() => setIsRoleManagerOpen(false)}
                    />
                </>
            )}
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        'TO_DO': 'bg-slate-100 text-slate-600',
        'TO_DONE': 'bg-slate-100 text-slate-600',
        'WRITING': 'bg-indigo-100 text-indigo-700',
        'UNDER_REVIEW': 'bg-amber-100 text-amber-700',
        'DONE': 'bg-emerald-100 text-emerald-700',
        'AUTHORIZED': 'bg-blue-100 text-blue-700',
        'VALIDATED': 'bg-purple-100 text-purple-700'
    };
    return (
        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase border border-transparent ${colors[status] || colors['TO_DONE']}`}>
            {status.replace('_', ' ')}
        </span>
    )
}

function CompletionBadge({ percentage }: { percentage: number }) {
    const isOverLimit = percentage > 100
    return (
        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${isOverLimit ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {percentage}%
        </span>
    )
}
