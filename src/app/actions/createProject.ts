"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const title = formData.get("title") as string;
  const acronym = formData.get("acronym") as string;
  const startDate = new Date(formData.get("startDate") as string);
  const duration = parseInt(formData.get("duration") as string);
  const nationalAgency = formData.get("nationalAgency") as string;
  const language = formData.get("language") as string;
  
  // Calculate End Date
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + duration);

  try {
    const project = await prisma.project.create({
      data: {
        title,
        titleEn: title,
        acronym,
        startDate,
        duration,
        endDate,
        nationalAgency,
        language,
        // Seed default structure
        works: {
            create: {
                title: "Project Management",
                startDate,
                endDate,
                modules: {
                    create: {
                        title: "Project Handbook",
                        order: 1,
                        officialText: "<h1>Project Handbook</h1><p>Welcome to the project...</p>",
                        status: "TO_DONE"
                    }
                }
            }
        },
        modules: {
            create: {
                title: "General Project Overview",
                order: 0,
                status: "TO_DONE",
                officialText: "This module is attached directly to the project."
            }
        }
      }
    });
    
    // Create default Work Packages based on typical structure?
    // For now, just the project.
    
  } catch (error) {
    console.error("Failed to create project:", error);
    return { error: "Failed to create project" };
  }
  
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
