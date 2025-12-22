import prisma from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CalendarView } from "@/components/calendar/CalendarView";

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const projects = await prisma.project.findMany({
      include: {
          works: true
      }
  });

  const events = [
      ...projects.map(p => ({
          id: `proj-${p.id}`,
          title: `Project: ${p.acronym}`,
          startDate: p.startDate,
          endDate: p.endDate,
          type: 'project' as const
      })),
      ...projects.flatMap(p => p.works.map(w => ({
          id: `work-${w.id}`,
          title: `WP: ${w.title}`,
          startDate: w.startDate,
          endDate: w.endDate,
          type: 'work' as const
      })))
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden dashboard-container">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 main-content">
        <Header />
        <main className="flex-1 p-6 flex flex-col min-h-0">
             <div className="mb-4">
                <h1 className="text-2xl font-bold text-slate-900">Project Calendar</h1>
                <p className="text-slate-500">Timeline of all projects and work packages.</p>
             </div>

             <div className="flex-1 min-h-0">
                <CalendarView events={events} />
             </div>
        </main>
      </div>
    </div>
  );
}
