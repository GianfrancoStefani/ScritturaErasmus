import { auth } from "@/auth";
import { getUserAvailability } from "@/app/actions/availabilityActions";
import { AvailabilityEditor } from "@/components/availability/AvailabilityEditor";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";

export default async function AvailabilityPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const year = 2025; // Default view or current year
    const availability2025 = await getUserAvailability(2025);
    const availability2026 = await getUserAvailability(2026);
    const availability2027 = await getUserAvailability(2027);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Resource Availability</h1>
            <p className="text-slate-500 mb-8">Define your working capacity for upcoming years.</p>

            <Tabs defaultValue="2025">
                <TabsList className="mb-6">
                    <TabsTrigger value="2025">2025</TabsTrigger>
                    <TabsTrigger value="2026">2026</TabsTrigger>
                    <TabsTrigger value="2027">2027</TabsTrigger>
                </TabsList>
                
                <TabsContent value="2025">
                    <AvailabilityEditor year={2025} initialData={availability2025} />
                </TabsContent>
                <TabsContent value="2026">
                    <AvailabilityEditor year={2026} initialData={availability2026} />
                </TabsContent>
                <TabsContent value="2027">
                    <AvailabilityEditor year={2027} initialData={availability2027} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
