"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const RegisterSchema = z.object({
  // Entity Details
  orgType: z.string().min(1, "Account Type is required"), // e.g. University, NPO
  orgName: z.string().min(1, "Organization Name is required"),
  
  // Personal Details
  title: z.string().optional(), // Mr, Mrs, Prof, Phd, Dr
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  nation: z.string().min(1, "Nation is required"), // Italy, Germany...
  city: z.string().min(1, "City is required"),
  
  // Auth
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export async function registerUser(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    
    // Validate
    const validatedFields = RegisterSchema.safeParse(rawData);
    if (!validatedFields.success) {
        return { error: "Validation failed. Please check all fields." };
    }

    const data = validatedFields.data;

    try {
        // 1. Check if email exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return { error: "Email already registered." };
        }
        
        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(data.password, 10);
        
        // 3. Transaction: Create Org + User + Link
        await prisma.$transaction(async (tx) => {
            // Create Organization
            const newOrg = await tx.organization.create({
                data: {
                    name: data.orgName,
                    type: data.orgType,
                    nation: data.nation,
                    city: data.city,
                    // Defaulting created by... logic happens implicitly
                }
            });

            // Create User
            // Username generation strategy: firstname.lastname.random
            const baseUsername = `${data.name.toLowerCase()}.${data.surname.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
            const randomSuffix = Math.floor(Math.random() * 10000);
            const username = `${baseUsername}${randomSuffix}`;

            const newUser = await tx.user.create({
                data: {
                    name: data.name,
                    surname: data.surname,
                    prefix: data.title,
                    role: "USER", // Default system role
                    username: username,
                    email: data.email,
                    password: hashedPassword,
                    city: data.city,
                    nation: data.nation
                }
            });

            // Create Affiliation
            await tx.userAffiliation.create({
                data: {
                    userId: newUser.id,
                    organizationId: newOrg.id,
                    role: "Check Admin", // Or generic role indicating they created it
                    departmentName: "Management" 
                }
            });
        });

        return { success: true };

    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Something went wrong. Please try again." };
    }
}
