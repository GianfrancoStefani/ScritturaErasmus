import { verifyProjectAccess } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const { id } = params;

  // Security Gate
  const access = await verifyProjectAccess(id);

  if (!access.authorized) {
      // Redirect to dashboard if unauthorized
      // Optionally could show an error page, but redirection is safer/cleaner for now
      redirect("/dashboard");
  }

  return (
    <>
      {children}
    </>
  );
}
