import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";
import GuestNotice from "@/components/auth/GuestNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isPlanKey, PRO_LIVE } from "@/lib/plans";

export const metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }) {
  const params = await searchParams;
  // ?plan=monthly|yearly comes from the "Get FOV Pro" button: after confirming their email the
  // visitor lands on the upgrade panel with that plan picked.
  const plan = PRO_LIVE && isPlanKey(params?.plan) ? params.plan : null;
  return (
    <AuthShell
      title="Create your account"
      subtitle={plan ? "Create your account, then choose your FOV Pro plan." : "Free while FOV is in preview. No card needed."}
    >
      {isSupabaseConfigured ? <SignupForm plan={plan} /> : <GuestNotice />}
      {!isSupabaseConfigured && (
        <p className="auth-alt"><Link href="/">← Back to the site</Link></p>
      )}
    </AuthShell>
  );
}
