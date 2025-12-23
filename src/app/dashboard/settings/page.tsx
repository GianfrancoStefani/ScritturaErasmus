import prisma from "@/lib/prisma";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session) {
      redirect("/login");
  }

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
        include: {
          memberships: {
              include: { 
                  project: true,
                  organization: true 
              },
              orderBy: { project: { title: 'asc' } }
          },
          availabilities: {
              orderBy: { year: 'asc' } 
          },
          affiliations: {
              include: { organization: true },
              orderBy: { createdAt: 'desc' }
          }
      }
  });

  if (!user) {
      return <div>User not found</div>;
  }

  return (
    <div className="space-y-6 pb-20">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500">Manage your profile, affiliations, and project preferences.</p>
        </div>

        <SettingsTabs user={user} />
    </div>
  );
}
