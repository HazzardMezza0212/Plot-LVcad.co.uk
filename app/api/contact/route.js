export async function POST(request) {
  const { email, message } = await request.json();

  if (!email || !message) {
    return Response.json(
      { error: "Email and message are required." },
      { status: 400 }
    );
  }

  // TODO: wire this up to a real notification channel (Resend/Postmark email,
  // a Slack webhook, etc). For now it just logs server-side so nothing is
  // dropped silently, but no one is actually notified yet.
  console.log("[contact]", { email, message });

  return Response.json({ ok: true });
}
