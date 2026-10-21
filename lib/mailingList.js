import "server-only";
import { Resend } from "resend";

// Keeps the Resend contact list in step with each account's email choice.
// Resend is where marketing emails are sent from; its unsubscribe links mark
// a contact as unsubscribed, which the account page reads back.

function client() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

function splitName(fullName) {
  const [first, ...rest] = (fullName || "").trim().split(/\s+/);
  return { firstName: first || undefined, lastName: rest.join(" ") || undefined };
}

// Returns { exists, unsubscribed } or null if Resend is unavailable.
export async function getContactStatus(email) {
  const resend = client();
  if (!resend) return null;
  const { data, error } = await resend.contacts.get({ email });
  if (error) {
    if (error.statusCode === 404 || /not.?found/i.test(error.message || "")) {
      return { exists: false, unsubscribed: false };
    }
    return null;
  }
  return { exists: true, unsubscribed: Boolean(data.unsubscribed) };
}

// Opted in: subscribe (create or re-subscribe). Opted out: mark unsubscribed
// if the contact exists. Returns true when Resend now matches the choice.
export async function syncContact({ email, fullName, optIn }) {
  const resend = client();
  if (!resend) return false;
  const status = await getContactStatus(email);
  if (!status) return false;

  if (status.exists) {
    const { error } = await resend.contacts.update({ email, unsubscribed: !optIn });
    return !error;
  }
  if (!optIn) return true; // nothing to do: never subscribed
  const { error } = await resend.contacts.create({
    email,
    unsubscribed: false,
    ...splitName(fullName),
  });
  return !error;
}

// Remove the contact entirely (used when an account is deleted).
export async function removeContact(email) {
  const resend = client();
  if (!resend) return true;
  const { error } = await resend.contacts.remove({ email });
  if (error && !(error.statusCode === 404 || /not.?found/i.test(error.message || ""))) {
    return false;
  }
  return true;
}
