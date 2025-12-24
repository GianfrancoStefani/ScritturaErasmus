import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getCurrentProjectRole(projectId: string): Promise<string | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    
    if (session.user.role === 'ADMIN') return 'ADMIN'; // System role override

    const member = await prisma.projectMember.findUnique({
        where: {
            userId_projectId: {
                userId: session.user.id,
                projectId
            }
        },
        select: { role: true }
    });

    return member?.role || null;
}

export async function verifyProjectAccess(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) return { authorized: false, error: "Unauthorized" };
    
    // Admin Override
    if (session.user.role === 'ADMIN') return { authorized: true };

    const member = await prisma.projectMember.findFirst({
        where: {
            projectId,
            userId: session.user.id
        }
    });

    if (!member) return { authorized: false, error: "Forbidden" };

    return { authorized: true, role: member.role };
}
