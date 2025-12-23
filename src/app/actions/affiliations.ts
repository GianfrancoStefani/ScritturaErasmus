"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getUserAffiliations() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.userAffiliation.findMany({
        where: { userId: session.user.id },
        include: { organization: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createUserAffiliation(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const organizationId = formData.get("organizationId") as string;
    const departmentName = formData.get("departmentName") as string;
    const role = formData.get("role") as string;
    const contactPerson = formData.get("contactPerson") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;

    if (!organizationId) return { error: "Organization is required" };

    try {
        await prisma.userAffiliation.create({
            data: {
                userId: session.user.id,
                organizationId,
                departmentName,
                role,
                contactPerson,
                phone,
                email
            }
        });
        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to create affiliation" };
    }
}

export async function deleteUserAffiliation(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        // Ensure user owns it
        const aff = await prisma.userAffiliation.findUnique({ where: { id } });
        if (!aff || aff.userId !== session.user.id) return { error: "Not found or unauthorized" };

        await prisma.userAffiliation.delete({ where: { id } });
        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (e) {
        return { error: "Failed to delete" };
    }
}

export async function updateUserAffiliation(id: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const departmentName = formData.get("departmentName") as string;
    const role = formData.get("role") as string;
    const contactPerson = formData.get("contactPerson") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;

    try {
        const aff = await prisma.userAffiliation.findUnique({ where: { id } });
        if (!aff || aff.userId !== session.user.id) return { error: "Not found or unauthorized" };

        await prisma.userAffiliation.update({
            where: { id },
            data: {
                departmentName,
                role,
                contactPerson,
                phone, 
                email
            }
        });
        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (e) {
        return { error: "Failed to update" };
    }
}
