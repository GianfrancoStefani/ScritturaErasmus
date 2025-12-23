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
  role: z.string().min(1, "Role is required"),
  type: z.string().min(1, "Type is required"),
  budget: z.coerce.number().min(0, "Budget must be positive"),
  website: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  logo: z.string().optional(),
  organizationId: z.string().optional().nullable(),
});

const UserSchema = z.object({
  partnerId: z.string(),
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email"),
  role: z.string().min(1, "Role is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  prefix: z.string().optional(),
  phone: z.string().optional(),
  landline: z.string().optional(),
  photo: z.string().optional(),
});

export type PartnerActionState = {
  success?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string[]> | null;
  message?: string | null;
};

export async function createPartner(formData: FormData): Promise<PartnerActionState> {
  const rawData = {
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    nation: formData.get("nation"),
    city: formData.get("city"),
    role: formData.get("role"),
    type: formData.get("type"),
    budget: formData.get("budget"),
    website: formData.get("website") || undefined,
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") || undefined,
    logo: formData.get("logo") || undefined,
    organizationId: formData.get("organizationId") || null,
  };

  const validation = PartnerSchema.safeParse(rawData);

  if (!validation.success) {
    return { fieldErrors: validation.error.flatten().fieldErrors };
  }

  const { projectId, organizationId, ...data } = validation.data;

  try {
    const partner = await prisma.partner.create({
      data: {
        ...data,
        organization: organizationId ? { connect: { id: organizationId } } : undefined,
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

export async function updatePartner(partnerId: string, projectId: string, formData: FormData): Promise<PartnerActionState> {
    const rawData = {
        projectId, // Keep for validation
        name: formData.get("name"),
        nation: formData.get("nation"),
        city: formData.get("city"),
        role: formData.get("role"),
        type: formData.get("type"),
        budget: formData.get("budget"),
        website: formData.get("website") || undefined,
        contactName: formData.get("contactName") || undefined,
        email: formData.get("email") || undefined,
        logo: formData.get("logo") || undefined,
        organizationId: formData.get("organizationId") || null,
    };

    const validation = PartnerSchema.safeParse(rawData);

    if (!validation.success) {
        return { fieldErrors: validation.error.flatten().fieldErrors };
    }

    const { projectId: _, organizationId, ...data } = validation.data;

    try {
        await prisma.partner.update({
            where: { id: partnerId },
            data: {
                ...data,
                organization: organizationId 
                    ? { connect: { id: organizationId } } 
                    : { disconnect: true }
            }
        });
        revalidatePath(`/dashboard/projects/${projectId}/partners`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to update partner" };
    }
}

export async function deletePartner(id: string, projectId: string): Promise<PartnerActionState> {
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

export async function createUser(formData: FormData): Promise<PartnerActionState> {
    const rawData = {
        partnerId: formData.get("partnerId"),
        name: formData.get("name"),
        surname: formData.get("surname"),
        email: formData.get("email"),
        role: formData.get("role"),
        username: formData.get("username"),
        password: formData.get("password"),
        prefix: formData.get("prefix"),
        phone: formData.get("phone"),
        landline: formData.get("landline"),
        photo: formData.get("photo"),
    };

    const validation = UserSchema.safeParse(rawData);

    // Initial creation requires password
    if (validation.success && !validation.data.password) {
        return { fieldErrors: { password: ["Password is required"] } };
    }

    if (!validation.success) {
        return { fieldErrors: validation.error.flatten().fieldErrors };
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

export async function updateUser(userId: string, partnerId: string, formData: FormData): Promise<PartnerActionState> {
    const rawData = {
        partnerId,
        name: formData.get("name"),
        surname: formData.get("surname"),
        email: formData.get("email"),
        role: formData.get("role"),
        username: formData.get("username"),
        password: formData.get("password") || undefined, // Optional for update
        prefix: formData.get("prefix"),
        phone: formData.get("phone"),
        landline: formData.get("landline"),
        photo: formData.get("photo"),
    };

    // Allow empty password for updates (zod schema needs optional logic tweak or local handling)
    // We reuse Schema but handle password separately if empty
    const { password, ...otherData } = rawData;
    
    // Validate everything except password first
    const partialValidation = UserSchema.omit({ password: true }).safeParse(otherData);

    if (!partialValidation.success) {
        return { fieldErrors: partialValidation.error.flatten().fieldErrors };
    }
    
    let updateData: any = { ...partialValidation.data };
    
    if (password && password.toString().length >= 6) {
        updateData.password = await bcrypt.hash(password.toString(), 10);
    } 
    // If password is provided but invalid
    else if (password && password.toString().length < 6) {
         return { fieldErrors: { password: ["Password must be at least 6 characters"] } };
    }

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });

    try {
        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });
        
        if (partner?.projectId) {
            revalidatePath(`/dashboard/projects/${partner.projectId}/partners`);
        }
        return { success: true };
    } catch (e: any) {
        return { error: "Failed to update user" };
    }
}

export async function deleteUser(userId: string, projectId: string): Promise<PartnerActionState> {
    try {
        await prisma.user.delete({ where: { id: userId } });
        revalidatePath(`/dashboard/projects/${projectId}/partners`);
        return { success: true };    
    } catch (error) {
        return { error: "Failed to delete user" };
    }
}
