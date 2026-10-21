import LaunchButton from "@/components/LaunchButton";

// Shown on the auth pages while Supabase isn't configured yet.
export default function GuestNotice() {
  return (
    <div className="guest-notice">
      <span className="status-pill open">
        <span className="dot"></span> Opening soon
      </span>
      <p>
        Accounts are being switched on. Until then you can open the FOV preview
        as a guest. Nothing you do there is stored on our side.
      </p>
      <LaunchButton label="Open FOV as a guest" />
    </div>
  );
}
