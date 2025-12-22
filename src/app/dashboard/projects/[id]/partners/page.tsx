import prisma from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PartnerTree } from "@/components/partners/PartnerTree";
import { CreatePartnerButton } from "@/components/partners/PartnerForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PartnersPage({ params }: { params: { id: string } }) {
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            partners: {
                include: { users: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!project) return <div>Project not found</div>;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-8 overflow-y-auto">
                     <div className="max-w-4xl mx-auto space-y-8">
                         <div className="flex flex-col gap-4">
                            <Link href={`/dashboard/projects/${project.id}`} className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-2 w-fit">
                                <ArrowLeft size={16} /> Back to Project
                            </Link>

                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">Partners & Users</h1>
                                    <p className="text-slate-500">Manage organizations and team members for <span className="font-semibold text-indigo-600">{project.acronym}</span>.</p>
                                </div>
                                <CreatePartnerButton projectId={project.id} />
                            </div>
                        </div>

                        <PartnerTree partners={project.partners} />
                     </div>
                </main>
            </div>
        </div>
    );
}
