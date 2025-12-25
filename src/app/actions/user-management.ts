"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { ROLES } from "@/lib/constants";

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
}) {
    try {
        // Handle Legacy Member "Promotion" to Real Member
        if (memberId.startsWith('legacy-')) {
            const parts = memberId.split('-');
            if (parts.length < 3) return { error: "Invalid legacy member ID" };
            
            const userId = parts[1];
            const partnerId = parts[2];

            // Create new ProjectMember record
            await prisma.projectMember.create({
                data: {
                    userId,
                    projectId,
                    partnerId,
                    roles: ["USER"], // Default role upon promotion
                    customDailyRate: data.customDailyRate
                }
            });
             
            revalidatePath(`/dashboard/projects/${projectId}/team`);
            return { success: true };
        }

        // Standard Update
        await prisma.projectMember.update({
            where: { id: memberId },
            data: {
                customDailyRate: data.customDailyRate
            }
        });

        revalidatePath(`/dashboard/projects/${projectId}/team`);
        return { success: true };
    } catch (error) {
        console.error("Update Profile Error:", error);
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
    // Handle Legacy / Virtual Members
    if (memberId.startsWith('legacy-')) {
        // Format: legacy-userId-partnerId
        const parts = memberId.split('-');
        // Safety check
        if (parts.length < 3) return null;
        
        const userId = parts[1];
        const partnerId = parts.slice(2).join('-'); // Handle case if partnerId has hyphens? No, usually CUID/UUID. but safe to join.
        // Actually partnerId is usually just the last part if not CUID. CUIDs don't have hyphens. UUIDs do.
        // Better: parts[1] is user, rest is partner? 
        // My generation was `legacy-${user.id}-${partner.id}`.
        // User ID (CUID) has no hyphens. Partner ID (CUID) has no hyphens.
        // So parts[1] is User, parts[2] is Partner.

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                availabilities: true
            }
        });
        
        const partner = await prisma.partner.findUnique({
             where: { id: parts[2] } // parts[2]
        });

        if (!user || !partner) return null;

        // Return Virtual Member
        return {
            id: memberId,
            userId: user.id,
            projectId: partner.projectId,
            partnerId: partner.id,
            roles: ["USER"], // Default fallback
            projectRole: "Member",
            customDailyRate: null,
            user: user,
            partner: partner
        };
    }

    // Handle Real Members
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
