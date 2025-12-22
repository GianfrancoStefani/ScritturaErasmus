import prisma from "@/lib/prisma";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
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
      where: { id: session.user.id }
  });

  if (!user) {
      return <div>User not found</div>;
  }

  return (
    <div className="space-y-6">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500">Manage your profile and account security.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Profile Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                    Profile Information
                </h2>
                <ProfileForm user={user} />
            </div>

            {/* Security Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                    Security
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                    Ensure your account is using a long, random password to stay secure.
                </p>
                <PasswordForm userId={user.id} />
            </div>
        </div>
    </div>
  );
}
