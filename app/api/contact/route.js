import { Resend } from "resend";
import { guardPublicPost, clip, EMAIL } from "@/lib/publicForm";

export async function POST(request) {
  const guard = await guardPublicPost(request, { name: "contact", limit: 5, windowMs: 60 * 60 * 1000 });
  if (guard.response) return guard.response;
  const body = guard.body;

  // Honeypot: real visitors never see or fill this field, so a filled value
  // means a bot. Report success without doing anything, so the bot doesn't
  // know it was caught.
  if (body.company) return Response.json({ ok: true });

  const email = clip(body.email, 254).toLowerCase();
  const message = clip(body.message, 5000);
  if (!EMAIL.test(email) || !message) {
    return Response.json({ error: "Please enter a valid email and a message." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_NOTIFY_EMAIL) {
    // Not configured (local development). Don't log the visitor's details.
    console.warn("[contact] message received but email sending is not configured");
    return Response.json({ ok: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Plot-LV Contact Form <onboarding@resend.dev>",
    to: process.env.CONTACT_NOTIFY_EMAIL,
    replyTo: email,
    subject: "New contact form message — Plot-LV",
    text: `From: ${email}\n\n${message}`,
  });
  if (error) {
    console.error("[contact] failed to send notification email", error.name || "error");
    return Response.json({ error: "Couldn't send your message just now. Please try again." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
