"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getProjectMembers(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    // TODO: Verify user access to project

    // 1. Fetch Explicit Project Members
    const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        include: {
            user: { select: { id: true, name: true, surname: true, email: true, photo: true } },
            partner: { select: { id: true, name: true } }
        }
    });

    // 2. Fetch Legacy Linkage (Users connected directly to Project Partners)
    // We need this because not all users might have been migrated to ProjectMember table yet
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            partners: {
                include: {
                    users: { select: { id: true, name: true, surname: true, email: true, photo: true } }
                }
            }
        }
    });

    if (!project) return projectMembers;

    // 3. Merge & Deduplicate
    const memberUserIds = new Set(projectMembers.map((pm: any) => pm.user.id));
    const allMembers = [...projectMembers];

    project.partners.forEach((partner: any) => {
        partner.users.forEach((user: any) => {
            if (!memberUserIds.has(user.id)) {
                // Determine inferred role or default
                // For legacy display, we constructs a "virtual" ProjectMember object
                allMembers.push({
                    id: `legacy-${user.id}-${partner.id}`, // Virtual ID
                    userId: user.id,
                    projectId: projectId,
                    partnerId: partner.id,
                    departmentId: null,
                    organizationId: null,
                    roles: ["USER"], // Default role
                    projectRole: "Member",
                    customDailyRate: null,
                    participationMode: null,
                    userAffiliationId: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: user,
                    partner: { id: partner.id, name: partner.name }
                });
                // Add to set to prevent duplicate legacy additions if user is in multiple partners (edge case)
                memberUserIds.add(user.id);
            }
        });
    });

    // Sort by surname
    return allMembers.sort((a, b) => a.user.surname.localeCompare(b.user.surname));
}

export async function getAllProjects() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const projects = await prisma.project.findMany({
        select: {
            id: true,
            title: true,
            acronym: true
        },
        orderBy: {
            startDate: 'desc'
        }
    });

    return projects;
}
