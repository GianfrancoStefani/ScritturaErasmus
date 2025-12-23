import prisma from "@/lib/prisma";
import { KanbanBoard, ModuleTask } from "@/components/kanban/KanbanBoard";

export const dynamic = 'force-dynamic';

export default async function KanbanPage() {
    const [modules, projects] = await Promise.all([
        prisma.module.findMany({
            include: {
                project: { select: { title: true, acronym: true, id: true } },
                section: { select: { id: true, title: true } },
                work: { select: { id: true, title: true } }
            },
            orderBy: { updatedAt: 'desc' }
        }),
        prisma.project.findMany({
            select: { id: true, title: true, acronym: true },
            orderBy: { updatedAt: 'desc' }
        })
    ]);

    const formattedModules: ModuleTask[] = modules.map(m => ({
        id: m.id,
        title: m.title,
        subtitle: m.project?.title || m.subtitle || "No Project",
        status: m.status as any,
        user: "GS", 
        sectionId: m.section?.id,
        sectionTitle: m.section?.title,
        workId: m.work?.id,
        workTitle: m.work?.title,
        projectId: m.project?.id || "", // Ensure projectId is available
        officialText: m.officialText || "" // Pass content for preview
    }));

    // Extract Unique Sections & Works (as before)
    const sectionsMap = new Map();
    modules.forEach(m => {
        if (m.section) sectionsMap.set(m.section.id, { id: m.section.id, title: m.section.title });
    });
    const sections = Array.from(sectionsMap.values());

    const worksMap = new Map();
    modules.forEach(m => {
        if (m.work) worksMap.set(m.work.id, { id: m.work.id, title: m.work.title });
    });
    const works = Array.from(worksMap.values());

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
                <p className="text-slate-500">Manage status of all modules across projects.</p>
            </div>

            <div className="flex-1 min-h-0 overflow-x-auto pb-6">
                <KanbanBoard 
                    initialModules={formattedModules} 
                    sections={sections}
                    works={works}
                    projects={projects}
                />
            </div>
        </div>
    );
}
