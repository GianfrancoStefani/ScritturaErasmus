"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function proposeName(projectId: string, title: string, acronym: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.projectNameProposal.create({
            data: {
                projectId,
                userId: session.user.id,
                title,
                acronym
            }
        });
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Propose Name Error:", error);
        return { error: "Failed to submit proposal" };
    }
}

export async function voteName(proposalId: string, stars: number) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.projectNameVote.upsert({
            where: {
                proposalId_userId: {
                    proposalId,
                    userId: session.user.id
                }
            },
            update: { stars },
            create: {
                proposalId,
                userId: session.user.id,
                stars
            }
        });
        
        // Find project ID to revalidate
        const proposal = await prisma.projectNameProposal.findUnique({
            where: { id: proposalId },
            select: { projectId: true }
        });
        
        if(proposal) revalidatePath(`/dashboard/projects/${proposal.projectId}`);
        
        return { success: true };
    } catch (error) {
        console.error("Vote Name Error:", error);
        return { error: "Failed to submit vote" };
    }
}

export async function getProposals(projectId: string) {
    const proposals = await prisma.projectNameProposal.findMany({
        where: { projectId },
        include: {
            user: {
                 select: { name: true, surname: true, photo: true }
            },
            votes: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // Calculate total scores (SUM of stars)
    const withScores = proposals.map(p => {
        const totalStars = p.votes.reduce((acc, v) => acc + v.stars, 0);
        const voteCount = p.votes.length;
        return { ...p, totalStars, voteCount };
    });

    // Sort by Total Stars DESC
    return withScores.sort((a, b) => b.totalStars - a.totalStars);
}
