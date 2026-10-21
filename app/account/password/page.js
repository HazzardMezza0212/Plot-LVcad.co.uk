import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import NewPasswordForm from "@/components/auth/NewPasswordForm";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Choose a new password | Plot-LV" };

export default async function NewPasswordPage() {
  if (!isSupabaseConfigured) redirect("/account");
  const user = await getUser();
  if (!user) redirect("/login?next=/account/password");

  return (
    <AuthShell title="Choose a new password" subtitle={`For ${user.email}`}>
      <NewPasswordForm />
    </AuthShell>
  );
}
