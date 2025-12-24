"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Role Definitions ---
export const ROLES = {
    PROJECT_MANAGER: "PROJECT_MANAGER",
    SCIENTIFIC_SUPERVISOR: "SCIENTIFIC_SUPERVISOR",
    WP_MANAGER: "WP_MANAGER",
    SECTOR_MANAGER: "SECTOR_MANAGER",
    TASK_MANAGER: "TASK_MANAGER",
    ACTIVITY_MANAGER: "ACTIVITY_MANAGER",
    EDITOR: "EDITOR",
    USER: "USER"
};

// --- Invite User ---
export async function inviteUser(
    projectId: string, 
    email: string, 
    partnerId: string, 
    roles: string[] = [ROLES.USER]
) {
    try {
        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        
        if (existingUser) {
            // Check if already a member
            const existingMember = await prisma.projectMember.findUnique({
                where: {
                    userId_projectId: { userId: existingUser.id, projectId }
                }
            });

            if (existingMember) {
                 return { error: "User is already a member of this project." };
            }

            // Direct Add if User Exists
            await prisma.projectMember.create({
                data: {
                    userId: existingUser.id,
                    projectId,
                    partnerId,
                    roles: roles,
                    role: roles[0] // Legacy fallback if needed, or remove if migration complete
                }
            });
            
            revalidatePath(`/dashboard/projects/${projectId}/team`);
            return { success: true, message: "User added directly." };
        }

        // 2. Create Invitation if User doesn't exist
        const token = crypto.randomUUID();
        // Since we are simulating email, we verify no pending invite exists
        const existingInvite = await prisma.invitation.findUnique({
            where: { email_projectId: { email, projectId } }
        });

        if (existingInvite) {
            return { error: "Invitation already pending for this email." };
        }

        await prisma.invitation.create({
            data: {
                email,
                projectId,
                partnerId: partnerId,
                roles: roles,
                token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }
        });

        // TODO: Send Email with Abstract Attachment logic here
        // For now, we simulate success
        
        revalidatePath(`/dashboard/projects/${projectId}/team`);
        return { success: true, message: "Invitation sent." };

    } catch (error) {
        console.error("Invite Error:", error);
        return { error: "Failed to invite user." };
    }
}

// --- Update Permissions ---
export async function updateMemberPermissions(memberId: string, projectId: string, roles: string[]) {
    try {
        await prisma.projectMember.update({
            where: { id: memberId },
            data: { roles: roles }
        });
        
        revalidatePath(`/dashboard/projects/${projectId}/team`);
        return { success: true };
    } catch (error) {
         return { error: "Failed to update permissions." };
    }
}

// --- Update Member Profile (Project Specific) ---
export async function updateMemberProfile(memberId: string, projectId: string, data: {
    customDailyRate?: number;
    // We could add more fields here like internal job title
}) {
    try {
        await prisma.projectMember.update({
            where: { id: memberId },
            data: {
                customDailyRate: data.customDailyRate
            }
        });

        revalidatePath(`/dashboard/projects/${projectId}/team`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to update profile." };
    }
}

// --- Availability Management ---
export async function saveUserAvailability(userId: string, year: number, monthValues: number[]){
    try {
        // monthValues is array of 12 integers (Jan-Dec)
        await prisma.userAvailability.upsert({
            where: {
                userId_year: { userId, year }
            },
            update: {
                daysJan: monthValues[0], daysFeb: monthValues[1], daysMar: monthValues[2],
                daysApr: monthValues[3], daysMay: monthValues[4], daysJun: monthValues[5],
                daysJul: monthValues[6], daysAug: monthValues[7], daysSep: monthValues[8],
                daysOct: monthValues[9], daysNov: monthValues[10], daysDec: monthValues[11]
            },
            create: {
                userId,
                year,
                daysJan: monthValues[0], daysFeb: monthValues[1], daysMar: monthValues[2],
                daysApr: monthValues[3], daysMay: monthValues[4], daysJun: monthValues[5],
                daysJul: monthValues[6], daysAug: monthValues[7], daysSep: monthValues[8],
                daysOct: monthValues[9], daysNov: monthValues[10], daysDec: monthValues[11]
            }
        });
        return { success: true };
    } catch (error) {
        return { error: "Failed to save availability." };
    }
}

// --- Get Detailed Member Info ---
export async function getProjectMemberDetails(memberId: string) {
    const member = await prisma.projectMember.findUnique({
        where: { id: memberId },
        include: {
            user: {
                include: {
                    availabilities: true
                }
            },
            partner: true
        }
    });

    return member;
}
