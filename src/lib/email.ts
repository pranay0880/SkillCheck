import "server-only";

const RESEND_URL = "https://api.resend.com";
const BATCH_LIMIT = 100;

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function canShowDevCode(): boolean {
  return !isEmailConfigured() && process.env.NODE_ENV === "development";
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? `Resend responded with ${response.status}`;
  } catch {
    return `Resend responded with ${response.status}`;
  }
}

export async function sendEmail(message: EmailMessage): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) return { ok: false, error: "Email is not configured (RESEND_API_KEY and EMAIL_FROM)." };
  const response = await fetch(`${RESEND_URL}/emails`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ from: process.env.EMAIL_FROM, ...message }),
  });
  return response.ok ? { ok: true } : { ok: false, error: await readError(response) };
}

export async function sendBatch(messages: EmailMessage[]): Promise<{ sent: number; error?: string }> {
  if (!isEmailConfigured()) return { sent: 0, error: "Email is not configured (RESEND_API_KEY and EMAIL_FROM)." };
  let sent = 0;
  for (let start = 0; start < messages.length; start += BATCH_LIMIT) {
    const chunk = messages.slice(start, start + BATCH_LIMIT).map((message) => ({ from: process.env.EMAIL_FROM, ...message }));
    const response = await fetch(`${RESEND_URL}/emails/batch`, { method: "POST", headers: headers(), body: JSON.stringify(chunk) });
    if (!response.ok) return { sent, error: await readError(response) };
    sent += chunk.length;
  }
  return { sent };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:Segoe UI,Arial,sans-serif;color:#16191f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #dde1e7;border-radius:12px;padding:28px">
<tr><td style="font-size:18px;font-weight:700;padding-bottom:16px">SkillCheck</td></tr>
<tr><td><h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>${body}</td></tr>
</table>
<p style="font-size:12px;color:#5b6472;margin-top:16px">You received this because your admin added you to SkillCheck.</p>
</td></tr></table></body></html>`;
}

export function otpEmail(name: string, testTitle: string, code: string, minutes: number): Omit<EmailMessage, "to"> {
  const html = layout(
    "Your verification code",
    `<p style="margin:0 0 12px">Hi ${escapeHtml(name)}, use this code to open <strong>${escapeHtml(testTitle)}</strong>:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:8px 0 16px;font-family:Consolas,monospace">${code}</p>
<p style="margin:0;color:#5b6472">It expires in ${minutes} minutes. If you did not request it, you can ignore this email.</p>`,
  );
  return {
    subject: `${code} is your SkillCheck code`,
    html,
    text: `Hi ${name},\n\nYour code for "${testTitle}" is ${code}.\nIt expires in ${minutes} minutes. If you did not request it, ignore this email.`,
  };
}

export function inviteEmail(
  name: string,
  testTitle: string,
  url: string,
  details: { questions: number; minutes: number; marks: number },
): Omit<EmailMessage, "to"> {
  const html = layout(
    `You're invited: ${testTitle}`,
    `<p style="margin:0 0 12px">Hi ${escapeHtml(name)}, you have been invited to take this assessment.</p>
<p style="margin:0 0 16px;color:#5b6472">${details.questions} questions · ${details.marks} marks · ${details.minutes} minutes</p>
<p style="margin:0 0 20px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#3b5bdb;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:6px">Open the test</a></p>
<p style="margin:0 0 8px">You will be asked for your employee email and employee ID, then a code sent to this email address. The timer starts only when you press Start.</p>
<p style="margin:0;color:#5b6472;font-size:13px">Link: ${escapeHtml(url)}</p>`,
  );
  return {
    subject: `Invitation: ${testTitle}`,
    html,
    text: `Hi ${name},\n\nYou have been invited to "${testTitle}" (${details.questions} questions, ${details.marks} marks, ${details.minutes} minutes).\n\nOpen the test: ${url}\n\nYou will be asked for your employee email and employee ID, then a code sent to this email. The timer starts only when you press Start.`,
  };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.length <= 2 ? local[0] : `${local[0]}${local[1]}`;
  return `${visible}${"•".repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}
