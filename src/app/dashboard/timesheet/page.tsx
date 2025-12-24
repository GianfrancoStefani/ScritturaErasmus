import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { TimesheetLog } from "@/components/timesheet/TimesheetLog";
import { getTimesheets } from "@/app/actions/timesheets";
import { Clock } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TimesheetPage() {
    const session = await auth();
    if (!session?.user) return <div>Unauthorized</div>;

    // Fetch user's active projects to allow logging to them
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            memberships: {
                include: {
                    project: true
                }
            }
        }
    });

    if (!user) return <div>User not found</div>;

    // Get recent logs
    // We fetch logs for ALL projects the user is in.
    // For simplicity, let's fetch only recent 20 logs across all projects.
    const recentLogs = await prisma.timesheetEntry.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        take: 20,
        include: { project: true }
    });

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                 <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-8 h-8 text-indigo-600" /> My Timesheet
                 </h1>
                 <p className="text-slate-500">Log your actual working hours.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Log Form Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800">Log New Entry</h2>
                    {user.memberships.length === 0 ? (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                            You are not a member of any project.
                        </div>
                    ) : (
                        user.memberships.map(membership => (
                            <div key={membership.projectId} className="mb-6">
                                <h3 className="font-medium text-slate-700 mb-2">{membership.project.acronym} - {membership.projectRole || 'Member'}</h3>
                                <TimesheetLog project={membership.project} currentUser={user} />
                            </div>
                        ))
                    )}
                </div>

                {/* Recent History Section */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Recent History</h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {recentLogs.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No time logged yet.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentLogs.map(log => (
                                    <div key={log.id} className="p-4 hover:bg-slate-50 flex justify-between items-center group">
                                        <div>
                                            <div className="font-semibold text-slate-800">{log.project.acronym}</div>
                                            <div className="text-xs text-slate-500">{log.date.toLocaleDateString()} {log.description && `• ${log.description}`}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-indigo-600">{log.hours}h</span>
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{log.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
