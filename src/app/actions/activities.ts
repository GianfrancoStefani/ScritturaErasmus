"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ActivitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  allocatedAmount: z.coerce.number().min(0, "Allocated amount must be positive"),
  estimatedStartDate: z.coerce.date(),
  estimatedEndDate: z.coerce.date(),
  venue: z.string().optional(),
  expectedResults: z.string().optional(),
});

export async function createActivity(taskId: string, formData: FormData) {
  const validatedFields = ActivitySchema.safeParse({
    title: formData.get("title"),
    allocatedAmount: formData.get("allocatedAmount"),
    estimatedStartDate: formData.get("estimatedStartDate"),
    estimatedEndDate: formData.get("estimatedEndDate"),
    venue: formData.get("venue"),
    expectedResults: formData.get("expectedResults"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { title, allocatedAmount, estimatedStartDate, estimatedEndDate, venue, expectedResults } = validatedFields.data;

  try {
    await prisma.activity.create({
      data: {
        taskId,
        title,
        allocatedAmount,
        estimatedStartDate,
        estimatedEndDate,
        venue,
        expectedResults,
        modules: {
          create: {
            title: "Activity Details",
            officialText: "<h2>Activity Details</h2><p>Provide detailed information about this activity.</p>",
            status: "TO_DONE",
            order: 0
          }
        }
      },
    });

    // We don't have the workId here easily to revalidate the full chain, 
    // strictly speaking we revalidate the Task Detail page
    // For now assuming a route like /dashboard/works/[workId]/tasks/[taskId] or similar.
    // Ideally we pass the path to revalidate or use a tag.
    // Let's revalidate broadly or specific if we know the URL structure.
    // For now, I'll rely on the client to refresh or revalidate a common path.
    // Better: pass the path to revalidate as argument or just revalidate the task page.
    // Since I don't have the task page URL structure finalized in my head (nested vs flat), 
    // I will try to revalidate the specific task page if I can guess it, 
    // but looking at valid paths, it depends on where this is called.
    return { success: true };
  } catch (error) {
    console.error("Failed to create activity:", error);
    return { error: "Failed to create activity" };
  }
}

export async function deleteActivity(activityId: string) {
  try {
    await prisma.activity.delete({
      where: { id: activityId },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete activity:", error);
    return { error: "Failed to delete activity" };
  }
}

export async function updateActivity(activityId: string, taskId: string, formData: FormData) {
  const validatedFields = ActivitySchema.safeParse({
    title: formData.get("title"),
    allocatedAmount: formData.get("allocatedAmount"),
    estimatedStartDate: formData.get("estimatedStartDate"),
    estimatedEndDate: formData.get("estimatedEndDate"),
    venue: formData.get("venue"),
    expectedResults: formData.get("expectedResults"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { title, allocatedAmount, estimatedStartDate, estimatedEndDate, venue, expectedResults } = validatedFields.data;

  try {
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        title,
        allocatedAmount,
        estimatedStartDate,
        estimatedEndDate,
        venue,
        expectedResults,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update activity:", error);
    return { error: "Failed to update activity" };
  }
}
