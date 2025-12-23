import prisma from "@/lib/prisma";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { MyProjectsList } from "@/components/settings/MyProjectsList";
import { AvailabilityEditor } from "@/components/availability/AvailabilityEditor";
import { AffiliationManager } from "@/components/settings/AffiliationManager";
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
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500">Manage your personal information, availability, and project details.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile & Security */}
            <div className="space-y-8 lg:col-span-1">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                        Personal Info
                    </h2>
                    <ProfileForm user={user} />
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                        Security
                    </h2>
                    <PasswordForm userId={user.id} />
                </div>
            </div>

            {/* Right Column: Work & Projects */}
            <div className="space-y-8 lg:col-span-2">
                 {/* Availability */}
                 <div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Availability</h2>
                    <AvailabilityEditor availabilities={user.availabilities} />
                 </div>

                 {/* Affiliations Cards */}
                 <div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Affiliation Cards</h2>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                        <p className="text-sm text-slate-500 mb-4">Create "Cards" for the organizations you work with. You can then quickly link these to your projects.</p>
                        <AffiliationManager affiliations={user.affiliations} />
                    </div>
                 </div>

                 {/* Projects */}
                 <div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">My Projects & Cost Settings</h2>
                    <MyProjectsList memberships={user.memberships} userId={user.id} affiliations={user.affiliations} />
                 </div>
            </div>
        </div>
    </div>
  );
}
