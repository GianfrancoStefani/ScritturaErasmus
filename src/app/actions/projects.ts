"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function updateProjectLogo(projectId: string, logoUrl: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.project.update({
            where: { id: projectId },
            data: { logoUrl }
        });
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Update Project Logo Error:", error);
        return { error: "Failed to update project logo" };
    }
}
