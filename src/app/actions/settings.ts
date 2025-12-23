"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  motherTongue: z.string().optional().nullable(),
  
  prefix: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(), // Receive as string from form
  photo: z.string().optional().nullable(),
});

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function updateProfile(userId: string, formData: FormData) {
  const session = await auth();
  if (!session || !session.user || session.user.id !== userId) {
      return { error: "Unauthorized" };
  }

  const rawData = {
    name: formData.get("name"),
    surname: formData.get("surname"),
    username: formData.get("username"),
    email: formData.get("email"),
    motherTongue: formData.get("motherTongue"),
    prefix: formData.get("prefix"),
    gender: formData.get("gender"),
    birthPlace: formData.get("birthPlace"),
    birthDate: formData.get("birthDate"), // "YYYY-MM-DD"
    photo: formData.get("photo"),
  };
  
  console.log("updateProfile rawData:", rawData);

  const validatedFields = ProfileSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { name, surname, username, email, motherTongue, prefix, gender, birthPlace, birthDate, photo } = validatedFields.data;

  try {
    // Check if username/email is taken by someone else
    const existing = await prisma.user.findFirst({
        where: {
            OR: [{ username }, { email }],
            NOT: { id: userId }
        }
    });

    if (existing) {
        return { error: "Username or Email already taken" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
          name, 
          surname, 
          username, 
          email, 
          motherTongue,
          prefix: prefix || null,
          gender: gender || null,
          birthPlace: birthPlace || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          photo: photo || null
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { error: "Failed to update profile" };
  }
}

export async function changePassword(userId: string, formData: FormData) {
    const session = await auth();

    if (!session || !session.user || session.user.id !== userId) {
        return { error: "Unauthorized" };
    }

    const validatedFields = PasswordSchema.safeParse({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
        confirmPassword: formData.get("confirmPassword"),
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { error: "User not found" };

        const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordsMatch) {
            return { error: { currentPassword: ["Incorrect current password"] } };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to change password:", error);
        return { error: "Failed to change password" };
        return { error: "Failed to change password" };
    }
}

export async function updateProjectMembership(userId: string, formData: FormData) {
    const session = await auth();
    if (!session || !session.user || session.user.id !== userId) {
        return { error: "Unauthorized" };
    }

    const projectId = formData.get("projectId") as string;
    const participationMode = formData.get("participationMode") as string;
    const projectRole = formData.get("projectRole") as string;
    const customDailyRate = parseFloat(formData.get("customDailyRate") as string) || 0;
    const organizationId = formData.get("organizationId") as string;
    const userAffiliationId = formData.get("userAffiliationId") as string;

    try {
        await prisma.projectMember.updateMany({
            where: {
                userId: userId,
                projectId: projectId
            },
            data: {
                participationMode,
                projectRole,
                customDailyRate,
                organizationId: organizationId || null,
                userAffiliationId: userAffiliationId || null
            }
        });

        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (e) {
        console.error("Update Membership Error:", e);
        return { error: "Failed to update membership" };
    }
}
