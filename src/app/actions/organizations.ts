"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

const OrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  type: z.string().optional(),
  nation: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

const DepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
});

export async function createOrganization(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const rawData = {
     name: formData.get("name"),
     shortName: formData.get("shortName"),
     type: formData.get("type"),
     nation: formData.get("nation"),
     address: formData.get("address"),
     logoUrl: formData.get("logoUrl"),
     website: formData.get("website"),
     email: formData.get("email"),
  };

  const validated = OrganizationSchema.safeParse(rawData);

  if (!validated.success) {
      console.error("Validation Error:", validated.error);
      return { error: "Invalid data: " + validated.error.errors.map(e => e.message).join(", ") };
  }
  
  const { name, shortName, type, nation, address, logoUrl, website, email } = validated.data;

  try {
     const org = await prisma.organization.create({
         data: { 
             name, 
             shortName, 
             type, 
             nation, 
             address, 
             logoUrl, 
             website, 
             email: email || null 
         }
     });
     revalidatePath("/dashboard/organizations");
     return { success: true, organization: org };
  } catch(e) {
     console.error("Create Org Error:", e);
     return { error: "Failed to create organization. It might already exist." };
  }
}

export async function deleteOrganization(id: string) {
    const session = await auth();
    // Only Admin?
    if ((session?.user as any)?.role !== 'ADMIN') return { error: "Only admins can delete organizations" };

    try {
        await prisma.organization.delete({ where: { id } });
        revalidatePath("/dashboard/organizations");
        return { success: true };
    } catch(e) {
        return { error: "Failed to delete" };
    }
}

export async function createDepartment(organizationId: string, name: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.department.create({
            data: { organizationId, name }
        });
        revalidatePath(`/dashboard/organizations`);
        return { success: true };
    } catch(e) {
        return { error: "Failed to add department" };
    }
}

export async function searchOrganizations(query: string) {
    if (!query || query.length < 2) return [];
    
    return await prisma.organization.findMany({
        where: {
            name: { contains: query, mode: 'insensitive' }
        },
        take: 10,
        include: { departments: true }
    });
}

export async function getOrganizations(filters?: { type?: string; nation?: string }) {
    const where: any = {};
    if (filters?.type && filters.type !== "ALL") where.type = filters.type;
    if (filters?.nation && filters.nation !== "ALL") where.nation = filters.nation;

    return await prisma.organization.findMany({
        where,
        include: { departments: true, _count: { select: { affiliations: true } } },
        orderBy: { name: 'asc' }
    });
}
