import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ProjectTeamList } from "@/components/project/ProjectTeamList";
import { redirect } from "next/navigation";
import { getEffectiveCost } from "@/lib/costs";
import { InviteManager } from "@/components/onboarding/InviteManager";
import { getCurrentProjectRole } from "@/lib/session";
import { hasProjectPermission, PERMISSIONS } from "@/lib/rbac";

export default async function ProjectTeamPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');
    const projectId = params.id;

    // RBAC Check
    const currentRole = await getCurrentProjectRole(projectId);
    const canManageTeam = hasProjectPermission(currentRole, PERMISSIONS.MANAGE_TEAM);
    const canManageCosts = hasProjectPermission(currentRole, PERMISSIONS.MANAGE_COSTS);

    // Fetch Project Members with Partner info
    const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: {
            partner: true,
            user: true
        }
    });

    // Calculate effective costs
    const membersWithCost = await Promise.all(members.map(async (m) => {
        const costInfo = await getEffectiveCost(m.id);
        return {
            ...m,
            effectiveCost: costInfo
        };
    }));

    return (
        <div className="max-w-7xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Project Team & Budgeting</h1>
            <p className="text-slate-500 mb-8">Manage roles and personnel costs for this project.</p>
            
            <ProjectTeamList 
                projectId={projectId} 
                initialMembers={membersWithCost} 
                readOnly={!canManageCosts}
            />
            
            {canManageTeam && (
                <InviteManager projectId={projectId} />
            )}
        </div>
    );
}
