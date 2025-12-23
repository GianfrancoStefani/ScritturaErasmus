"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveAvailability(year: number, data: Record<string, number>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;

    // Data maps daysJan -> number
    await prisma.userAvailability.upsert({
        where: {
            userId_year: {
                userId,
                year
            }
        },
        create: {
            userId,
            year,
            ...data
        },
        update: {
            ...data
        }
    });

    revalidatePath('/dashboard/availability');
    return { success: true };
}

export async function getUserAvailability(year: number) {
    const session = await auth();
    if (!session?.user?.id) return null;

    return prisma.userAvailability.findUnique({
        where: {
            userId_year: {
                userId: session.user.id,
                year
            }
        }
    });
}
