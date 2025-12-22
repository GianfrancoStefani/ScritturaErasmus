"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveModuleContent(moduleId: string, content: string) {
  try {
    await prisma.module.update({
      where: { id: moduleId },
      data: { officialText: content },
    });
    
    // We don't necessarily want to revalidate the whole page constantly while typing,
    // as it might cause UI jitters if not handled carefully client-side.
    // However, for data consistency on other tabs/users, it's good practice.
    // Let's assume the revalidation is cheap enough or handled via optimistic UI locally.
    revalidatePath(`/dashboard/projects/[id]/modules/${moduleId}`, 'page');
    
    return { success: true };
  } catch (error) {
    console.error("Failed to save content:", error);
    return { error: "Failed to save content" };
  }
}
