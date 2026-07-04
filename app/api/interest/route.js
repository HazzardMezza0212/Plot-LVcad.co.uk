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

  const { name, email } = await request.json();
  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const [firstName, ...rest] = (name || "").trim().split(" ");

  const { error } = await resend.contacts.create({
    email,
    firstName: firstName || undefined,
    lastName: rest.join(" ") || undefined,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
