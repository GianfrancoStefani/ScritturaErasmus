import prisma from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
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
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6 overflow-hidden flex flex-col">
                     <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
                        <p className="text-slate-500">Manage status of all modules across projects.</p>
                     </div>

                     <div className="flex-1 overflow-x-auto overflow-y-hidden">
                        <KanbanBoard initialModules={formattedModules} />
                     </div>
                </main>
            </div>
        </div>
    );
}
