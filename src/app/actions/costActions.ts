"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getCurrentProjectRole } from "@/lib/session";
import { hasProjectPermission, PERMISSIONS } from "@/lib/rbac";

// --- Standard Costs ---

export async function createStandardCost(data: { area: string, nation: string, role: string, dailyRate: number }) {
    const session = await auth();
    // Only Admin can manage standard costs
    if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Unauthorized");

    await prisma.standardCost.create({
        data
    });

    revalidatePath('/dashboard/admin/costs');
    return { success: true };
}

export async function updateStandardCost(id: string, data: Partial<{ area: string, nation: string, role: string, dailyRate: number }>) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Unauthorized");

    await prisma.standardCost.update({
        where: { id },
        data
    });

    revalidatePath('/dashboard/admin/costs');
    return { success: true };
}

export async function deleteStandardCost(id: string) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Unauthorized");

    await prisma.standardCost.delete({
        where: { id }
    });

    revalidatePath('/dashboard/admin/costs');
    return { success: true };
}

// --- Project Member Overrides ---

export async function updateMemberCost(memberId: string, customDailyRate: number | null, projectRole: string | null) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    
    // Fetch member to get Project ID
    const member = await prisma.projectMember.findUnique({
        where: { id: memberId },
        select: { projectId: true }
    });

    if (!member) throw new Error("Member not found");

    const role = await getCurrentProjectRole(member.projectId);
    if (!hasProjectPermission(role, PERMISSIONS.MANAGE_COSTS)) {
        throw new Error("Insufficient permissions");
    }
    
    await prisma.projectMember.update({
        where: { id: memberId },
        data: {
            customDailyRate,
            projectRole
        }
    });

    revalidatePath(`/dashboard/projects/${member.projectId}/team`);
    return { success: true };
}
