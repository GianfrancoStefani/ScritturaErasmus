"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

const PartnerSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1, "Name is required"),
  nation: z.string().min(1, "Nation is required"),
  city: z.string().min(1, "City is required"),
  role: z.string().min(1, "Role is required"), // Coordinator, Partner, etc.
  type: z.string().min(1, "Type is required"), // University, NGO, etc.
  budget: z.coerce.number().min(0, "Budget must be positive"),
  website: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

const UserSchema = z.object({
  partnerId: z.string(),
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email"),
  role: z.string().min(1, "Role is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(), // Optional for updates if we supported them
});

export async function createPartner(formData: FormData) {
  const rawData = {
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    nation: formData.get("nation"),
    city: formData.get("city"),
    role: formData.get("role"),
    type: formData.get("type"),
    budget: formData.get("budget"),
    website: formData.get("website"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
  };

  const validation = PartnerSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  const { projectId, ...data } = validation.data;

  try {
    await prisma.partner.create({
      data: {
        ...data,
        project: { connect: { id: projectId } },
      },
    });
    revalidatePath(`/dashboard/projects/${projectId}/partners`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create partner:", error);
    return { error: "Failed to create partner" };
  }
}

export async function deletePartner(id: string, projectId: string) {
  try {
    await prisma.partner.delete({
       where: { id } 
    });
    revalidatePath(`/dashboard/projects/${projectId}/partners`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete partner" };
  }
}

export async function createUser(formData: FormData) {
    const rawData = {
        partnerId: formData.get("partnerId"),
        name: formData.get("name"),
        surname: formData.get("surname"),
        email: formData.get("email"),
        role: formData.get("role"),
        username: formData.get("username"),
        password: formData.get("password"),
    };

    const validation = UserSchema.safeParse(rawData);

    // Initial creation requires password
    if (validation.success && !validation.data.password) {
        return { error: { password: ["Password is required"] } };
    }

    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }

    const { partnerId, password, ...userData } = validation.data;
    const hashedPassword = await bcrypt.hash(password!, 10);
    
    // Check if partner exists to get projectId for revalidation
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });

    try {
        await prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
                partnerId: partnerId
            }
        });
        
        if (partner?.projectId) {
            revalidatePath(`/dashboard/projects/${partner.projectId}/partners`);
        }
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') {
             return { error: "Email or username already exists" };
        }
        return { error: "Failed to create user" };
    }
}

export async function deleteUser(userId: string, projectId: string) {
    try {
        await prisma.user.delete({ where: { id: userId } });
        revalidatePath(`/dashboard/projects/${projectId}/partners`);
        return { success: true };    
    } catch (error) {
        return { error: "Failed to delete user" };
    }
}
