"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ActivitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  venue: z.string().optional(),
  estimatedStartDate: z.string().transform((str) => new Date(str)),
  estimatedEndDate: z.string().transform((str) => new Date(str)),
  leadingOrgId: z.string().optional(),
  participatingOrgIds: z.array(z.string()),
  allocatedAmount: z.coerce.number().min(0, "Allocated amount must be positive"),
  expectedResults: z.string().max(250).optional(),
});

export async function createActivity(taskId: string, projectId: string, formData: FormData) {
  try {
    const rawData = {
      title: formData.get("title"),
      venue: formData.get("venue"),
      estimatedStartDate: formData.get("estimatedStartDate"),
      estimatedEndDate: formData.get("estimatedEndDate"),
      leadingOrgId: formData.get("leadingOrgId") || undefined,
      participatingOrgIds: formData.getAll("participatingOrgIds"),
      allocatedAmount: formData.get("allocatedAmount"),
      expectedResults: formData.get("expectedResults"),
    };

    const data = ActivitySchema.parse(rawData);

    await prisma.activity.create({
      data: {
        taskId,
        ...data,
      },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to create activity:", e);
    return { error: "Failed to create activity" };
  }
}

export async function updateActivity(activityId: string, projectId: string, formData: FormData) {
  try {
    const rawData = {
      title: formData.get("title"),
      venue: formData.get("venue"),
      estimatedStartDate: formData.get("estimatedStartDate"),
      estimatedEndDate: formData.get("estimatedEndDate"),
      leadingOrgId: formData.get("leadingOrgId") || undefined,
      participatingOrgIds: formData.getAll("participatingOrgIds"),
      allocatedAmount: formData.get("allocatedAmount"),
      expectedResults: formData.get("expectedResults"),
    };

    const data = ActivitySchema.parse(rawData);

    await prisma.activity.update({
      where: { id: activityId },
      data: data,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to update activity:", e);
    return { error: "Failed to update activity" };
  }
}

export async function deleteActivity(activityId: string, projectId: string) {
    try {
        await prisma.activity.delete({
            where: { id: activityId }
        });
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to delete activity:", e);
        return { error: "Failed to delete activity" };
    }
}
