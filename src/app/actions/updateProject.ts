"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProjectMetadata(projectId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const titleEn = formData.get("titleEn") as string;
  const acronym = formData.get("acronym") as string;
  const startDate = new Date(formData.get("startDate") as string);
  const duration = parseInt(formData.get("duration") as string);
  const endDateInput = formData.get("endDate") as string;
  const nationalAgency = formData.get("nationalAgency") as string;
  const language = formData.get("language") as string;

  const budget = parseFloat(formData.get("budget") as string) || null;
  const deadlineInput = formData.get("deadline") as string;
  const deadline = deadlineInput ? new Date(deadlineInput) : null;
  const programId = formData.get("programId") as string || null;

  // Recalculate End Date based on new duration/start date if end date not provided manually? 
  // Or trust the form data since I put an input for it.
  // Ideally if user changes duration, end date updates. 
  // Simple logic: if endDate input exists, use it. Else calc.
  let endDate = endDateInput ? new Date(endDateInput) : new Date(startDate);
  if (!endDateInput) {
     endDate.setMonth(endDate.getMonth() + duration);
  }

  try {
    await prisma.project.update({
        where: { id: projectId },
        data: {
            title,
            titleEn, 
            acronym,
            startDate,
            duration,
            endDate,
            nationalAgency,
            language,
            budget,
            deadline,
            programId
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
