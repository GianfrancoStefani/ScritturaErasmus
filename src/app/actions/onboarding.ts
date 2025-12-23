"use server";

import prisma from "@/lib/prisma";
import { auth, signIn } from "@/auth";

export async function completeOnboarding(token: string, data: any) {
    // 1. Validate Token
    const invite = await prisma.invitation.findUnique({
        where: { token },
        include: { project: true }
    });

    if (!invite || invite.status !== 'PENDING') return { error: "Invalid invitation" };

    let userId = "";

    // 2. Handle User (Create or Link)
    const session = await auth();
    if (session?.user?.id) {
        // Logged in user
        userId = session.user.id;
        // Verify email matches? 
        if (session.user.email !== invite.email) {
            // Strict security: Invite email must match account email
            return { error: `This invite is for ${invite.email}, but you are logged in as ${session.user.email}` };
        }
    } else {
        // New User Creation
        // Validation needed
        if (!data.name || !data.surname || !data.password) return { error: "Missing fields" };
        
        try {
            const newUser = await prisma.user.create({
                data: {
                    email: invite.email,
                    name: data.name,
                    surname: data.surname,
                    password: data.password, // TODO: Hash password!
                    role: "USER" // Default
                }
            });
            userId = newUser.id;
            // TODO: Auto-login
        } catch (e) {
            return { error: "User creation failed (Email might trigger unique constraint)" };
        }
    }

    // 3. Create Project Member
    try {
        await prisma.projectMember.create({
            data: {
                userId,
                projectId: invite.projectId,
                role: "MEMBER", 
                participationMode: data.mode,
                customDailyRate: data.dailyRate > 0 ? data.dailyRate : null,
                partnerId: data.partnerId
            }
        });
        
        // 4. Update Invite Status
        await prisma.invitation.update({
            where: { id: invite.id },
            data: { status: "ACCEPTED" }
        });

        // 5. Update Availability (Simple stub)
        if (data.daysPerMonth > 0) {
            const year = new Date().getFullYear();
            // TODO: Upsert UserAvailability logic
            await prisma.userAvailability.upsert({
                where: { userId_year: { userId, year } },
                update: { monthlyCapacity: data.daysPerMonth * 12 }, // Simplified
                create: { userId, year, monthlyCapacity: data.daysPerMonth * 12 }
            });
        }

        return { success: true };
    } catch (e) {
        console.error("Onboarding Error:", e);
        return { error: "Failed to join project. Please try again." };
    }
}
