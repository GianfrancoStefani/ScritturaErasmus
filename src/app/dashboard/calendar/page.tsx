import prisma from "@/lib/prisma";
import { CalendarView } from "@/components/calendar/CalendarView";

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const projects = await prisma.project.findMany({
      where: { isTemplate: false },
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
    <div className="flex flex-col h-full overflow-hidden">
        <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Project Calendar</h1>
            <p className="text-slate-500">Timeline of all projects and work packages.</p>
        </div>

        <div className="flex-1 min-h-0">
            <CalendarView events={events} />
        </div>
    </div>
  );
}
