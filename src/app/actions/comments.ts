"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createComment({ 
    moduleId, 
    textComponentId, 
    content, 
    userId,
    path
}: { 
    moduleId?: string, 
    textComponentId?: string, 
    content: string, 
    userId: string,
    path: string
}) {
  try {
    if (!moduleId && !textComponentId) {
        return { error: "Target ID required" };
    }

    await prisma.comment.create({
      data: {
        moduleId,
        textComponentId,
        content,
        userId
      }
    });

    revalidatePath(path);
    return { success: true };
  } catch (e) {
    console.error("Failed to create comment:", e);
    return { error: "Failed to create comment" };
  }
}

export async function deleteComment(commentId: string, path: string) {
    try {
        await prisma.comment.delete({ where: { id: commentId } });
        revalidatePath(path);
        return { success: true };
    } catch (e) {
        console.error("Failed to delete comment:", e);
        return { error: "Failed to delete comment" };
    }
}
