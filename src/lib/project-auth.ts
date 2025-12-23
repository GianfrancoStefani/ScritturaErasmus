import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function verifyProjectAccess(projectId: string) {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    const userId = session.user.id;

    const membership = await prisma.projectMember.findUnique({
        where: {
            userId_projectId: {
                userId: userId,
                projectId: projectId
            }
        },
        include: {
            partner: true,
            project: true
        }
    });

    if (!membership) {
        // Log unauthorized access attempt?
        console.warn(`User ${userId} attempted to access project ${projectId} without membership.`);
        redirect('/dashboard'); // Or a 403 page
    }

    return membership;
}

export async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.email) return null;
    
    return prisma.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true }
    });
}
