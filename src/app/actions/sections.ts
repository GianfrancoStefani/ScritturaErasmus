"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSection(projectId: string, title: string) {
    if (!title || !projectId) return { error: "Missing fields" };

    try {
        const lastSection = await prisma.section.findFirst({
            where: { projectId },
            orderBy: { order: 'desc' }
        });

        await prisma.section.create({
            data: {
                projectId,
                title,
                order: (lastSection?.order || 0) + 1
            }
        });

        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to create section" };
    }
}
