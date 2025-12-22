export default function CalendarPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <span className="text-2xl font-bold">🚧</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Project Calendar</h1>
            <p className="text-slate-500 max-w-md">
                This feature is under development. Track deadlines and milestones across all your projects.
            </p>
        </div>
    )
}
