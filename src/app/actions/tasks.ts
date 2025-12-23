"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budget: z.coerce.number().min(0, "Budget must be positive"),
});

export async function createTask(workId: string, formData: FormData) {
  const validatedFields = TaskSchema.safeParse({
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    budget: formData.get("budget"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { title, startDate, endDate, budget } = validatedFields.data;

  try {
    await prisma.task.create({
      data: {
        workId,
        title,
        startDate,
        endDate,
        budget,
        modules: {
          create: {
            title: "Task Description",
            officialText: "<h2>Task Description</h2><p>Describe the specific tasks to be performed.</p>",
            status: "TO_DONE",
            order: 0
          }
        }
      },
    });

    revalidatePath(`/dashboard/works/${workId}`); // Assuming detailed view
    // Also revalidate the parent work page if needed, though simpler is better.
    return { success: true };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { error: "Failed to create task" };
  }
}

export async function deleteTask(taskId: string, workId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath(`/dashboard/works/${workId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { error: "Failed to delete task" };
  }
}

export async function updateTask(taskId: string, workId: string, formData: FormData) {
  const validatedFields = TaskSchema.safeParse({
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    budget: formData.get("budget"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { title, startDate, endDate, budget } = validatedFields.data;

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        startDate,
        endDate,
        budget,
      },
    });

    revalidatePath(`/dashboard/works/${workId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { error: "Failed to update task" };
  }
}

export async function assignUserToTask(taskId: string, userId: string, days: number, months: string[]) {
  try {
     await prisma.assignment.create({
        data: {
           taskId,
           userId,
           days,
           months: JSON.stringify(months),
           dailyRate: 0 
        }
     });
     
     // We should revalidate the task page or work page
     // revalidatePath(`/dashboard/works/${workId}`); // We don't have workId easy, so maybe path?
     // Just return success
     return { success: true };
  } catch (error) {
     console.error("Failed to assign user:", error);
     return { error: "Failed to assign user" };
  }
}

export async function removeAssignment(assignmentId: string) {
  try {
     await prisma.assignment.delete({ where: { id: assignmentId } });
     return { success: true };
  } catch (error) {
     return { error: "Failed to remove assignment" }; 
  }
}

export async function getTaskAssignments(taskId: string) {
    const assignments = await prisma.assignment.findMany({
        where: { taskId },
        include: {
            user: { select: { id: true, name: true, surname: true, email: true } }
        }
    });
    return assignments;
}
