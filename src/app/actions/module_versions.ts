"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveModuleVersion(moduleId: string, content: string, currentUserId?: string) {
  try {
    await prisma.moduleVersion.create({
      data: {
        moduleId,
        content
      }
    });

    // Optionally revalidate? Not strictly needed for history unless we show it immediately
    revalidatePath(`/dashboard/modules/${moduleId}`); // Assuming individual module page
    return { success: true };
  } catch (e) {
    console.error("Failed to save module version:", e);
    return { error: "Failed to save version" };
  }
}

export async function getModuleVersions(moduleId: string) {
  try {
    const versions = await prisma.moduleVersion.findMany({
      where: { moduleId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        // We might not want to fetch content for ALL versions in a list if it's huge
        // But for <Simple List> it's okay. Optimization later.
        content: true 
      }
    });
    return { versions };
  } catch (e) {
    console.error("Failed to fetch versions:", e);
    return { error: "Failed to fetch versions" };
  }
}

export async function restoreModuleVersion(moduleId: string, versionId: string, projectId: string) {
    // This function sets the module's current officialText to the version's content
    try {
        const version = await prisma.moduleVersion.findUnique({
            where: { id: versionId }
        });

        if (!version) return { error: "Version not found" };

        await prisma.module.update({
            where: { id: moduleId },
            data: {
                officialText: version.content
            }
        });

        revalidatePath(`/dashboard/projects/${projectId}/modules/${moduleId}`);
         revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    } catch(e) {
        console.error("Failed to restore version", e);
        return { error: "Failed to restore version" };
    }
}

export async function getAnnotatedVersionsForModules(moduleIds: string[]) {
    try {
        const versions = await prisma.moduleVersion.findMany({
            where: {
                moduleId: { in: moduleIds },
                isAnnotated: true
            },
            include: {
                module: {
                    select: { title: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { versions };
    } catch (e) {
        console.error("Failed to fetch annotated versions:", e);
        return { error: "Failed to fetch versions" };
    }
}
