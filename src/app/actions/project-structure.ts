"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getProjectStructure(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    // Fetch hierarchical structure with Partners for cascading assignment logic if needed
    // Simplified fetch for Assignment Matrix
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            title: true,
            sections: {
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    title: true,
                    partners: { select: { partnerId: true } } // For filtering suggestions
                }
            },
            works: {
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    title: true,
                    partners: { select: { partnerId: true } },
                    tasks: {
                        orderBy: { id: 'asc' }, // No order field in schema for tasks? Check schema. Task has no order, using ID or creation.
                        select: {
                            id: true,
                            title: true,
                            partners: { select: { partnerId: true } },
                            activities: {
                                select: {
                                    id: true,
                                    title: true,
                                    participatingOrgIds: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return project;
}
