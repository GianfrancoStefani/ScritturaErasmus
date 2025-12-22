"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateModuleStatus(moduleId: string, newStatus: string) {
  try {
    const module = await prisma.module.update({
      where: { id: moduleId },
      data: { status: newStatus },
    });
    
    revalidatePath("/dashboard/kanban");
    revalidatePath(`/dashboard/projects`);
    // Ideally we would revalidate the specific project page too, but we might not have the ID handy easily here without fetching.
    // Given the global nature of Kanban, revalidating the board is primary.
    
    return { success: true, module };
  } catch (error) {
    console.error("Failed to update module status:", error);
    return { error: "Failed to update module status" };
  }
}
