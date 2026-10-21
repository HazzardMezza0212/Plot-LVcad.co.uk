import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";
import GuestNotice from "@/components/auth/GuestNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Create your account | Plot-LV" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Free while FOV is in preview. No card needed."
    >
      {isSupabaseConfigured ? <SignupForm /> : <GuestNotice />}
      {!isSupabaseConfigured && (
        <p className="auth-alt"><Link href="/">← Back to the site</Link></p>
      )}
    </AuthShell>
  );
}
