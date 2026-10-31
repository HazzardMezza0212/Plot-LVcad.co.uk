import { Resend } from "resend";
import { guardPublicPost, clip, EMAIL } from "@/lib/publicForm";

export async function POST(request) {
  const guard = await guardPublicPost(request, { name: "interest", limit: 5, windowMs: 60 * 60 * 1000 });
  if (guard.response) return guard.response;
  const body = guard.body;

  // Honeypot (see /api/contact).
  if (body.company) return Response.json({ ok: true });

  const email = clip(body.email, 254).toLowerCase();
  if (!EMAIL.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn("[interest] RESEND_API_KEY is not set");
    return Response.json({ error: "The interest list isn't open just yet. Please try again later." }, { status: 503 });
  }

  const [firstName, ...rest] = clip(body.name, 120).split(/\s+/);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.contacts.create({
    email,
    unsubscribed: false,
    firstName: firstName || undefined,
    lastName: rest.join(" ") || undefined,
  });

  if (error) {
    // Already on the list. Report success but change nothing: if they had
    // unsubscribed, a stranger typing their address here must not re-subscribe
    // them (they can opt back in from their account page).
    if (/already exists|duplicate/i.test(error.message || "")) return Response.json({ ok: true });
    console.error("[interest] could not add contact", error.name || "error");
    return Response.json({ error: "Couldn't add you just now. Please try again." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
