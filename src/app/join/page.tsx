import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { auth } from "@/auth";

export default async function JoinPage({ searchParams }: { searchParams: { token: string } }) {
    const token = searchParams.token;
    if (!token) return <div className="p-8 text-center text-red-500">Invalid link</div>;

    // Validate Token
    const invite = await prisma.invitation.findUnique({
        where: { token },
        include: { project: true }
    });

    if (!invite) return <div className="p-8 text-center text-red-500">Invitation not found or expired</div>;
    if (invite.status !== 'PENDING') return <div className="p-8 text-center text-amber-500">Invitation already used</div>;
    if (new Date() > invite.expiresAt) return <div className="p-8 text-center text-red-500">Invitation expired</div>;

    // Check if user is logged in
    const session = await auth();
    const isLoggedIn = !!session?.user;
    const userEmail = session?.user?.email;

    // Logic:
    // If logged in and email matches invite -> Proceed to Wizard
    // If logged in but email mismatch -> Warn "You are logged in as X, invite is for Y"
    // If not logged in -> Redirect to Register/Login with callback? 
    // Actually, Wizard should handle "New User" creation inline or link to register.
    // Simplifying: If not logged in, show "Register to Join" or "Login to Join".
    
    // Allow user to continue if emails match OR if they register now.
    
    // Fetch Partners for selection
    const partners = await prisma.partner.findMany({
        where: { projectId: invite.projectId },
        select: { id: true, name: true }
    });

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <OnboardingWizard 
                invite={invite} 
                currentUser={session?.user}
                partners={partners} 
            />
        </div>
    );
}
