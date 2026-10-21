import { Resend } from "resend";

export async function POST(request) {
  if (!process.env.RESEND_API_KEY) {
    return Response.json(
      {
        error:
          "Interest list isn't configured yet — add RESEND_API_KEY to .env.local.",
      },
      { status: 500 }
    );
  }

  const { name, email, company } = await request.json();

  // Honeypot: real visitors never see or fill this field, so a filled value
  // means a bot. Report success without actually doing anything, so the bot
  // doesn't know it was caught.
  if (company) {
    return Response.json({ ok: true });
  }

  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const [firstName, ...rest] = (name || "").trim().split(" ");

  const { error } = await resend.contacts.create({
    email,
    unsubscribed: false,
    firstName: firstName || undefined,
    lastName: rest.join(" ") || undefined,
  });

  if (error) {
    // Already on the list (perhaps unsubscribed earlier): they've just asked
    // again, so re-subscribe them.
    if (/already exists|duplicate/i.test(error.message || "")) {
      const { error: updateError } = await resend.contacts.update({ email, unsubscribed: false });
      if (!updateError) return Response.json({ ok: true });
    }
    return Response.json({ error: "Couldn't add you just now. Please try again." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
