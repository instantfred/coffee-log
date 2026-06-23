import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth — the proxy already guards these routes.
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <main className="flex-1 px-5 pb-28 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
