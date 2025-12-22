"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateModuleContent(moduleId: string, content: string) {
  try {
    await prisma.module.update({
      where: { id: moduleId },
      data: {
        officialText: content,
        completion: calculateCompletion(content) // Mock logic
      }
    });
    
    // Also create update logic for "status" if needed?
    // For now update text.
    
    revalidatePath(`/dashboard/projects`); 
    // Ideally specific path, but we don't know project ID here easily without fetch.
    return { success: true };
  } catch (error) {
    console.error("Update failed:", error);
    return { error: "Failed to save" };
  }
}

function calculateCompletion(text: string): number {
    // Simple heuristic: 1000 chars = 100%?
    const len = text.length;
    return Math.min(100, Math.floor((len / 1000) * 100));
}
