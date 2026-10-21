import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import GuestNotice from "@/components/auth/GuestNotice";
import { Notice } from "@/components/auth/fields";
import LaunchButton from "@/components/LaunchButton";
import { isSupabaseConfigured, safeNextPath } from "@/lib/supabase/config";

export const metadata = { title: "Log in | Plot-LV" };

const MESSAGES = {
  link: ["error", "That link has expired or was opened in a different browser. Log in below, or request a new link."],
  confirmed: ["success", "Email confirmed. Log in to continue."],
  signedout: ["info", "You've been signed out."],
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const msg = MESSAGES[params.error] || MESSAGES[params.status];

  return (
    <AuthShell
      title="Welcome back"
      subtitle={next.startsWith("/cctv") ? "Log in to open FOV." : "Log in to your Plot-LV account."}
    >
      {msg && <Notice tone={msg[0]}>{msg[1]}</Notice>}
      {isSupabaseConfigured ? <LoginForm next={next} /> : <GuestNotice />}
      {isSupabaseConfigured && (
        <div className="auth-guest">
          <span className="auth-or mono">or</span>
          <LaunchButton href="/guest" label="Continue as guest" className="btn-secondary auth-guest-btn" icon={false} />
          <p className="guest-terms">
            Use FOV without an account. By continuing you agree to the{" "}
            <Link href="/terms">terms of use</Link>.
          </p>
        </div>
      )}
      {!isSupabaseConfigured && (
        <p className="auth-alt"><Link href="/">← Back to the site</Link></p>
      )}
    </AuthShell>
  );
}
