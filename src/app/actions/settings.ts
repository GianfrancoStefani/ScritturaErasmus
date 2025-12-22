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
});

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function updateProfile(userId: string, formData: FormData) {
  const session = await auth();
  if (!session || !session.user || session.user.id !== userId) {
      return { error: "Unauthorized" };
  }

  const validatedFields = ProfileSchema.safeParse({
    name: formData.get("name"),
    surname: formData.get("surname"),
    username: formData.get("username"),
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { name, surname, username, email } = validatedFields.data;

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
      data: { name, surname, username, email },
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
    }
}
