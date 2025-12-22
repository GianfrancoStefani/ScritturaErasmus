"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteModule(projectId: string, moduleId: string) {
  try {
    await prisma.module.delete({
      where: {
        id: moduleId,
      },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete module:", error);
    return { error: "Failed to delete module" };
  }
}
