import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { StandardCostList } from "@/components/costs/StandardCostList";
import { redirect } from "next/navigation";

export default async function CostAdminPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const costs = await prisma.standardCost.findMany({
        orderBy: [
            { area: 'asc' },
            { nation: 'asc' },
            { role: 'asc' }
        ]
    });

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Standard Cost Grid</h1>
                    <p className="text-slate-500">Manage standard monthly personnel costs for all projects.</p>
                </div>
            </div>
            
            <StandardCostList initialCosts={costs} />
        </div>
    );
}
