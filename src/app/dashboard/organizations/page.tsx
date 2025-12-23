import prisma from "@/lib/prisma";
import { OrganizationManager } from "@/components/organizations/OrganizationManager";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function OrganizationsPage() {
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    // Fetch initial list (limit 50)
    const orgs = await prisma.organization.findMany({
        take: 50,
        orderBy: { name: 'asc' },
        include: { departments: true }
    });

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Organizations Directory</h1>
                <p className="text-slate-500">Global registry of Universities, NGOs, and Companies.</p>
            </div>
            
            <OrganizationManager initialOrgs={orgs} isAdmin={isAdmin} />
        </div>
    );
}
