"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getProjectMembers(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    // TODO: Verify user access to project

    const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: {
            user: {
                select: { id: true, name: true, surname: true, email: true }
            },
            partner: {
                select: { id: true, name: true }
            }
        },
        orderBy: {
            user: { surname: 'asc' }
        }
    });

    return members;
}
