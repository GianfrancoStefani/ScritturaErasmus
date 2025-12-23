"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProject(projectId: string, prevState: any, formData: FormData) {
  const title = formData.get("title") as string;
  const acronym = formData.get("acronym") as string;
  const startDate = new Date(formData.get("startDate") as string);
  const duration = parseInt(formData.get("duration") as string);
  const nationalAgency = formData.get("nationalAgency") as string;
  const language = formData.get("language") as string;

  // Recalculate End Date based on new duration/start date
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + duration);

  try {
    await prisma.project.update({
        where: { id: projectId },
        data: {
            title,
            titleEn: title, // Keeping in sync for now as per plan
            acronym,
            startDate,
            duration,
            endDate,
            nationalAgency,
            language,
        }
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, message: "Project updated successfully" };
  } catch (error) {
    console.error("Failed to update project:", error);
    return { error: "Failed to update project" };
  }
}
