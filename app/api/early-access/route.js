import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { guardPublicPost } from "@/lib/publicForm";
import { getContactStatus } from "@/lib/mailingList";

// "Join FOV Pro early access", used by the landing page and the FOV tool.
// Saves the entry in Supabase (public.pro_early_access, private: only visible
// in the Supabase dashboard) and, when CONTACT_NOTIFY_EMAIL is set, emails the
// site owner so each signup can be followed up personally.

const ROLES = ["Installer", "Consultant / designer", "Integrator", "End user / facilities", "Other"];
const SOURCES = ["landing", "tool", "account"];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const clip = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(request) {
  // The FOV tool (a separate static build) also posts here with source "tool" and cannot
  // show the CAPTCHA, so only the landing page form is CAPTCHA-checked. Both are
  // same-origin checked and rate limited.
  const guard = await guardPublicPost(request, {
    name: "early-access", limit: 5, windowMs: 60 * 60 * 1000,
    captcha: (b) => b.source !== "tool",
  });
  if (guard.response) return guard.response;
  const body = guard.body;

  // Honeypot: real visitors never see or fill this field.
  if (body.company) return Response.json({ ok: true });

  const email = clip(body.email, 254).toLowerCase();
  if (!EMAIL.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const name = clip(body.name, 120);
  const role = ROLES.includes(body.role) ? body.role : "";
  const wants = clip(body.wants, 1000);
  const updates = body.updates === true;
  const source = SOURCES.includes(body.source) ? body.source : "landing";

  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Early access isn't open just yet. Please try again later." }, { status: 503 });
  }
  const { error } = await supabase.rpc("join_pro_early_access", {
    p_email: email, p_name: name, p_role: role, p_wants: wants, p_updates_opt_in: updates, p_source: source,
  });
  if (error) {
    console.error("[early-access] save failed", error.message);
    return Response.json({ error: "Couldn't add you just now. Please try again." }, { status: 500 });
  }

  // Ticked "also email me product updates": add them to the mailing list, but
  // never re-subscribe someone who unsubscribed before.
  if (updates && process.env.RESEND_API_KEY) {
    const status = await getContactStatus(email);
    if (status && !status.exists) {
      const [firstName, ...rest] = name.split(/\s+/);
      const { error: listError } = await new Resend(process.env.RESEND_API_KEY).contacts.create({
        email, unsubscribed: false, firstName: firstName || undefined, lastName: rest.join(" ") || undefined,
      });
      if (listError) console.error("[early-access] mailing list add failed", listError);
    }
  }

  if (process.env.RESEND_API_KEY && process.env.CONTACT_NOTIFY_EMAIL) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: mailError } = await resend.emails.send({
      from: "Plot-LV <onboarding@resend.dev>",
      to: process.env.CONTACT_NOTIFY_EMAIL,
      replyTo: email,
      subject: `FOV Pro early access: ${name || email}`,
      text: [
        `Name: ${name || "-"}`,
        `Email: ${email}`,
        `Role: ${role || "-"}`,
        `From: ${source}`,
        `Product updates: ${updates ? "yes" : "no"}`,
        "",
        "What would make Pro worth paying for:",
        wants || "-",
      ].join("\n"),
    });
    if (mailError) console.error("[early-access] notification email failed", mailError);
  }

  return Response.json({ ok: true });
}
