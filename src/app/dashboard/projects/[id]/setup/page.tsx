import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { ProjectMetadataForm } from "@/components/project/ProjectMetadataForm";
import { NamingChallenge } from "@/components/project/NamingChallenge";
import { SetupAbstractSection } from "@/components/project/SetupAbstractSection";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function ProjectSetupPage({ params }: { params: { id: string } }) {
    const session = await auth();
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            modules: {
                where: { title: "Abstract" }, 
                include: { components: true }
            }
        }
    });

    // Fetch Programs for the dropdown
    const programs = await prisma.program.findMany({ orderBy: { code: 'asc' } });

    if (!project) return <div>Project not found</div>;

    const abstractModule = project.modules.find(m => m.title === "Abstract");

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                 <Link href={`/dashboard/projects/${project.id}`} className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-2 mb-4 w-fit">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Project Setup</h1>
                        <p className="text-slate-500">Configure global project settings and abstract.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Metadata */}
                <div className="lg:col-span-2 space-y-8">
                    <ProjectMetadataForm project={project} programs={programs} />
                    <SetupAbstractSection projectId={project.id} abstractModule={abstractModule} />
                </div>

                {/* Right Col: Naming & Extras */}
                <div className="space-y-6">
                    {session?.user?.id && (
                        <NamingChallenge projectId={project.id} userId={session.user.id} />
                    )}
                </div>
            </div>
        </div>
    );
}
