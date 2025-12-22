"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const WorkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  budget: z.coerce.number().min(0, "Budget must be positive"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export async function createWork(projectId: string, formData: FormData) {
  const validatedFields = WorkSchema.safeParse({
    title: formData.get("title"),
    budget: formData.get("budget"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { title, budget, startDate, endDate } = validatedFields.data;

  try {
    await prisma.work.create({
      data: {
        projectId,
        title,
        budget,
        startDate,
        endDate,
      },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/works");
    return { success: true };
  } catch (error) {
    console.error("Failed to create work:", error);
    return { error: "Failed to create work package" };
  }
}

export async function deleteWork(workId: string, projectId: string) {
  try {
    await prisma.work.delete({
      where: { id: workId },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
     revalidatePath("/dashboard/works");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete work:", error);
    return { error: "Failed to delete work package" };
  }
}
