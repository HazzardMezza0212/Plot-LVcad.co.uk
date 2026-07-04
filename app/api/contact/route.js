import { Resend } from "resend";

export async function POST(request) {
  const { email, message, company } = await request.json();

  // Honeypot: real visitors never see or fill this field, so a filled value
  // means a bot. Report success without actually doing anything, so the bot
  // doesn't know it was caught.
  if (company) {
    return Response.json({ ok: true });
  }

  if (!email || !message) {
    return Response.json(
      { error: "Email and message are required." },
      { status: 400 }
    );
  }

  if (process.env.RESEND_API_KEY && process.env.CONTACT_NOTIFY_EMAIL) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Plot-LV Contact Form <onboarding@resend.dev>",
      to: process.env.CONTACT_NOTIFY_EMAIL,
      replyTo: email,
      subject: "New contact form message — Plot-LV",
      text: `From: ${email}\n\n${message}`,
    });
    if (error) console.error("[contact] failed to send notification email", error);
  } else {
    console.log("[contact]", { email, message });
  }

  return Response.json({ ok: true });
}
