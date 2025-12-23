"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getCurrentProjectRole } from "@/lib/session";
import { hasProjectPermission, PERMISSIONS } from "@/lib/rbac";

export async function createInvitation(projectId: string, email: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const role = await getCurrentProjectRole(projectId);
    if (!hasProjectPermission(role, PERMISSIONS.MANAGE_TEAM)) {
        return { error: "Insufficient permissions" };
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findFirst({
        where: { projectId, user: { email } }
    });

    if (existingMember) {
        return { error: "User is already a member of this project" };
    }

    // Check if pending invitation exists
    const existingInvite = await prisma.invitation.findUnique({
        where: { email_projectId: { email, projectId } }
    });

    if (existingInvite) {
        return { error: "Invitation already sent to this email" };
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    try {
        await prisma.invitation.create({
            data: {
                projectId,
                email,
                token,
                expiresAt,
                status: "PENDING"
            }
        });

        // Mock Email Sending
        console.log(`[MOCK EMAIL] Invite sent to ${email} for project ${projectId}. Link: /join?token=${token}`);

        revalidatePath(`/dashboard/projects/${projectId}/team`);
        return { success: true };
    } catch (error) {
        console.error("Failed to create invitation:", error);
        return { error: "Failed to send invitation" };
    }
}

export async function getProjectInvitations(projectId: string) {
    const role = await getCurrentProjectRole(projectId);
    if (!hasProjectPermission(role, PERMISSIONS.MANAGE_TEAM)) {
        return [];
    }

    return await prisma.invitation.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function deleteInvitation(id: string, projectId: string) {
    const role = await getCurrentProjectRole(projectId);
    if (!hasProjectPermission(role, PERMISSIONS.MANAGE_TEAM)) {
        return { error: "Insufficient permissions" };
    }

    try {
        await prisma.invitation.delete({ where: { id } });
        revalidatePath(`/dashboard/projects/${projectId}/team`);
        return { success: true };
    } catch (e) {
        return { error: "Failed to delete" };
    }
}
