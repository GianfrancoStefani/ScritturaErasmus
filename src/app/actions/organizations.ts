"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

const OrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  nation: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  unirankUrl: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  scopeProjectId: z.string().optional().nullable(),
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
     city: formData.get("city"),
     address: formData.get("address"),
     logoUrl: formData.get("logoUrl"),
     website: formData.get("website"),
     unirankUrl: formData.get("unirankUrl"),
     email: formData.get("email"),
     scopeProjectId: formData.get("scopeProjectId") || null,
  };

  const validated = OrganizationSchema.safeParse(rawData);

  if (!validated.success) {
      console.error("Validation Error:", validated.error);
      const errorMsg = Object.entries(validated.error.flatten().fieldErrors)
          .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
          .join("; ");
      return { error: "Invalid data: " + errorMsg };
  }
  
  const { name, shortName, type, nation, city, address, logoUrl, website, unirankUrl, email, scopeProjectId } = validated.data;

  try {
     const org = await prisma.organization.create({
         data: { 
             name, 
             shortName, 
             type, 
             nation, 
             city, 
             address, 
             logoUrl, 
             website, 
             unirankUrl,
             email: email || null,
             scopeProjectId: scopeProjectId || null
         }
     });
     revalidatePath("/dashboard/organizations");
     return { success: true, organization: org };
  } catch(e: any) {
     console.error("Create Org Error:", e);
     return { error: "Failed to create organization. It might already exist." };
  }
}

// ... updateOrganization remains largely same unless we want to change scope (unlikely) ...

export async function searchScopedOrganizations(query: string, type: string, projectId: string) {
    if (!query) return { data: [], total: 0 };
    
    // Visibility Rule:
    // If type == "University", search GLOBAL organizations (scopeProjectId: null)
    // If type != "University", search PROJECT SPECIFIC organizations (scopeProjectId: projectId)
    
    const whereClause: any = {
        name: { contains: query, mode: 'insensitive' as const },
        type: { equals: type, mode: 'insensitive' as const } // Case-insensitive type match
    };

    if (type.toLowerCase() === "university") {
        whereClause.scopeProjectId = null;
    } else {
        whereClause.scopeProjectId = projectId;
    }

    const data = await prisma.organization.findMany({
        where: whereClause,
        take: 20,
        orderBy: { name: 'asc' }
    });
    
    return { data };
}

export async function updateOrganization(id: string, formData: FormData) {
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
        unirankUrl: formData.get("unirankUrl"),
        email: formData.get("email"),
    };

    const validated = OrganizationSchema.omit({ scopeProjectId: true }).safeParse(rawData);

    if (!validated.success) {
        return { error: "Invalid data: " + (validated.error as any).errors.map((e: any) => e.message).join(", ") };
    }
    
    const { name, shortName, type, nation, address, logoUrl, website, unirankUrl, email } = validated.data;

    try {
        const org = await prisma.organization.update({
            where: { id },
            data: { 
                name, 
                shortName, 
                type, 
                nation, 
                address, 
                logoUrl, 
                website, 
                unirankUrl,
                email: email || null 
            }
        });
        revalidatePath("/dashboard/organizations");
        return { success: true, organization: org };
    } catch(e: any) {
        console.error("Update Org Error:", e);
        return { error: "Failed to update organization." };
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

export async function searchOrganizations(query: string, page: number = 1, limit: number = 20) {
    if (!query) return { data: [], total: 0 };
    
    // "Immediate" search: Target only name for speed
    const where = {
        name: { contains: query, mode: 'insensitive' as const }
    };

    const [total, data] = await prisma.$transaction([
        prisma.organization.count({ where }),
        prisma.organization.findMany({
            where,
            take: limit,
            skip: (page - 1) * limit,
            include: { departments: true },
            orderBy: { name: 'asc' } // Ensure consistent order
        })
    ]);

    return { data, total };
}

export async function getOrganizations(filters?: { type?: string; nation?: string }, page: number = 1, limit: number = 20) {
    const where: any = {};
    if (filters?.type && filters.type !== "ALL") where.type = filters.type;
    if (filters?.nation && filters.nation !== "ALL") where.nation = filters.nation;

    const [total, data] = await prisma.$transaction([
        prisma.organization.count({ where }),
        prisma.organization.findMany({
            where,
            take: limit,
            skip: (page - 1) * limit,
            include: { departments: true, _count: { select: { affiliations: true } } },
            orderBy: { name: 'asc' }
        })
    ]);

    return { data, total };
}
