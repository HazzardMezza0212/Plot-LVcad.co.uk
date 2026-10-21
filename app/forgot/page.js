import AuthShell from "@/components/auth/AuthShell";
import ForgotForm from "@/components/auth/ForgotForm";
import GuestNotice from "@/components/auth/GuestNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Reset your password | Plot-LV" };

export default function ForgotPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new one."
    >
      {isSupabaseConfigured ? <ForgotForm /> : <GuestNotice />}
    </AuthShell>
  );
}
