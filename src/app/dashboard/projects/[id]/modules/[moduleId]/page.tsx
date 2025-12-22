import prisma from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ModuleEditorPage({ params }: { params: { id: string, moduleId: string } }) {
    const moduleData = await prisma.module.findUnique({
        where: { id: params.moduleId },
        include: {
            project: { select: { title: true, acronym: true } }
        }
    });

    if (!moduleData) return <div>Module not found</div>;

    return (
        <div className="flex dashboard-container">
            <Sidebar />
            <div className="flex-1 flex flex-col main-content">
                <Header />
                <main className="flex-1 flex flex-col" style={{ padding: '1.5rem', height: 'calc(100vh - 64px)' }}>
                     <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
                        <Link 
                            href={`/dashboard/projects/${params.id}`} 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}
                        >
                            <ArrowLeft size={16} /> Back to {moduleData.project?.acronym || 'Project'}
                        </Link>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                            {moduleData.title}
                        </h1>
                     </div>

                    <div style={{ flex: 1, minHeight: 0, paddingBottom: 0 }}>
                         <RichTextEditor 
                            moduleId={moduleData.id} 
                            initialContent={moduleData.officialText || ""} 
                         />
                     </div>
                </main>
            </div>
        </div>
    );
}
