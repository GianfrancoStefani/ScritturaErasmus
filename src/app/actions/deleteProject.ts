"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteProject(projectId: string) {
  try {
    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { error: "Failed to delete project" };
  }
}
