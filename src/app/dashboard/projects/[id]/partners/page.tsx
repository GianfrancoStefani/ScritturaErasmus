import prisma from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PartnerTree } from "@/components/partners/PartnerTree";
import { CreatePartnerButton } from "@/components/partners/PartnerForm";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PartnersPage({ params }: { params: { id: string } }) {
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            partners: {
                include: { 
                    users: true,
                    projectMembers: {
                        include: { user: true },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!project) return <div>Project not found</div>;

    // Transform partners to include project-specific members
    const partners = project.partners.map((p: any) => {
        // Map project members to the UserData shape, using the project-specific role
        const projectUsers = p.projectMembers.map((pm: any) => ({
            ...pm.user,
            role: pm.role, // Use project role
            partnerId: p.id // Force context partner ID
        }));

        // Legacy users
        const legacyUsers = p.users.map((u: any) => ({
            ...u,
            role: u.role || 'Member',
            partnerId: p.id
        }));

        // Merge and Deduplicate (prioritize project members)
        const allUsers = [...projectUsers, ...legacyUsers].filter((obj: any, index: number, self: any[]) =>
            index === self.findIndex((t: any) => (t.id === obj.id))
        );

        return {
            ...p,
            users: allUsers
        };
    });

    return (
        <div className="bg-slate-50 min-h-screen">
             <div className="p-8 space-y-8 max-w-5xl mx-auto">
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <Link href={`/dashboard/projects/${project.id}`} className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-2 w-fit">
                            <ArrowLeft size={16} /> Back to Project
                        </Link>
                        <Link href="/dashboard/partners" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2">
                            <Users size={16} /> Global Partner Directory
                        </Link>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Partners & Users</h1>
                            <p className="text-slate-500">Manage organizations and team members for <span className="font-semibold text-indigo-600">{project.acronym}</span>.</p>
                        </div>
                        <CreatePartnerButton projectId={project.id} />
                    </div>
                </div>

                <PartnerTree partners={partners} />
             </div>
        </div>
    );
}
