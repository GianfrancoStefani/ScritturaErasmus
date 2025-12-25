"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveAnnotation(moduleId: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.textComponent.create({
      data: {
        moduleId,
        authorId: session.user.id,
        type: "ANNOTATION",
        content: JSON.stringify(data),
        status: "AUTHORIZED"
      }
    });

    revalidatePath(`/dashboard/projects/[id]/preview`, 'page');
    return { success: true };
  } catch (error) {
    console.error("Failed to save annotation:", error);
    return { error: "Failed to save annotation" };
  }
}

export async function deleteAnnotation(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.textComponent.delete({
      where: { id }
    });

    revalidatePath(`/dashboard/projects/[id]/preview`, 'page');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete annotation:", error);
    return { error: "Failed to delete annotation" };
  }
}

export async function deleteAllUserAnnotations(moduleId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.textComponent.deleteMany({
      where: { 
        moduleId,
        authorId: session.user.id,
        type: "ANNOTATION"
      }
    });

    revalidatePath(`/dashboard/projects/[id]/preview`, 'page');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete all annotations:", error);
    return { error: "Failed to delete all annotations" };
  }
}

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

export async function saveUserNote(moduleId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // We check if a note by this user already exists for this module
    // If so, we update it. If not, we create it.
    // Simplifying: creating a new one or updating the latest one.
    const existing = await prisma.textComponent.findFirst({
      where: {
        moduleId,
        authorId: session.user.id,
        type: "USER_NOTE"
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      await prisma.textComponent.update({
        where: { id: existing.id },
        data: { content }
      });
    } else {
      await prisma.textComponent.create({
        data: {
          moduleId,
          authorId: session.user.id,
          type: "USER_NOTE",
          content,
          status: "STANDBY"
        }
      });
    }

    revalidatePath(`/dashboard/projects/[id]/preview`, 'page');
    return { success: true };
  } catch (error) {
    console.error("Failed to save note:", error);
    return { error: "Failed to save note" };
  }
}

export async function saveAnnotatedVersion(moduleId: string, annotations: any[]) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const moduleData = await prisma.module.findUnique({
            where: { id: moduleId },
            select: { officialText: true }
        });

        if (!moduleData) return { error: "Module not found" };

        // Create version name
        const date = new Date();
        const formattedDate = date.toLocaleDateString('it-IT');
        const formattedTime = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const versionName = `${session.user.name || 'User'} - ${formattedDate} ${formattedTime} (Annotated Version)`;

        await prisma.moduleVersion.create({
            data: {
                moduleId,
                content: moduleData.officialText || "",
                isAnnotated: true,
                annotations: JSON.stringify(annotations)
            }
        });

        revalidatePath(`/dashboard/projects/[id]/modules/${moduleId}`, 'page');
        return { success: true };
    } catch (error) {
        console.error("Failed to save annotated version:", error);
        return { error: "Failed to save annotated version" };
    }
}
