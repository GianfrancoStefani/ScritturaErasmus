import prisma from "@/lib/prisma";
import { KanbanBoard, ModuleTask } from "@/components/kanban/KanbanBoard";

export const dynamic = 'force-dynamic';

export default async function KanbanPage() {
    const modules = await prisma.module.findMany({
        include: {
            project: { select: { title: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });

    const formattedModules: ModuleTask[] = modules.map(m => ({
        id: m.id,
        title: m.title,
        subtitle: m.project?.title || m.subtitle || "No Project",
        status: m.status as any,
        user: "GS" // Placeholder until we have assignments
    }));

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
                <p className="text-slate-500">Manage status of all modules across projects.</p>
            </div>

            <div className="flex-1 min-h-0 overflow-x-auto pb-6">
                <KanbanBoard initialModules={formattedModules} />
            </div>
        </div>
    );
}
