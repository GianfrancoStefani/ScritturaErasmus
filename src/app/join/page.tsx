import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { auth } from "@/auth";
import { Button } from "@/components/ui/Button"; // Assuming available
import { KeyRound } from "lucide-react";

export default async function JoinPage({ searchParams }: { searchParams: { token: string } }) {
    const token = searchParams.token;

    // 1. Manual Token Entry UI
    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <KeyRound size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Have an invite?</h1>
                    <p className="text-slate-500 mb-6">Enter your invitation token below to join the project.</p>
                    
                    <form className="flex flex-col gap-4">
                        <input 
                            type="text" 
                            name="token" 
                            placeholder="Enter token (e.g. 123-abc...)" 
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                        <Button type="submit" className="w-full rounded-lg h-12 text-base">
                            Verify Token
                        </Button>
                    </form>
                    
                    <p className="mt-6 text-sm text-slate-400">
                        Don't have a token? Ask your project coordinator.
                    </p>
                </div>
            </div>
        );
    }

    // 2. Validate Token
    const invite = await prisma.invitation.findUnique({
        where: { token },
        include: { project: true }
    });

    if (!invite) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow text-center border border-red-100">
                <div className="text-red-500 font-bold text-xl mb-2">Invalid Invitation</div>
                <p className="text-slate-500">The token provided is invalid or required parameters are missing.</p>
                <a href="/join" className="mt-4 inline-block text-indigo-600 hover:underline">Try again</a>
            </div>
        </div>
    );

    if (invite.status !== 'PENDING') return (
         <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow text-center border border-amber-100">
                <div className="text-amber-500 font-bold text-xl mb-2">Invitation Used</div>
                <p className="text-slate-500">This invitation has already been redeemed.</p>
                <a href="/login" className="mt-4 inline-block text-indigo-600 hover:underline">Go to Login</a>
            </div>
        </div>
    );

    if (new Date() > invite.expiresAt) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
             <div className="bg-white p-8 rounded-xl shadow text-center border border-red-100">
                <div className="text-red-500 font-bold text-xl mb-2">Invitation Expired</div>
                <p className="text-slate-500">This invitation has expired.</p>
            </div>
        </div>
    );

    // Check if user is logged in
    const session = await auth();
    
    // Fetch Partners for selection within the wizard
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
