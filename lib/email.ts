import 'server-only';
import { Resend } from 'resend';
import type { LeaveApplication, LeaveType, User } from '@/types';

const FROM = 'NAUB LMS <noreply@naub.edu.ng>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const RESEND_KEY = process.env.RESEND_API_KEY;

/**
 * Thin wrapper around Resend. In demo mode (no RESEND_API_KEY) the calls
 * are logged to the console so the dev can verify the email flow without
 * a real Resend account.
 */
const client = RESEND_KEY ? new Resend(RESEND_KEY) : null;

async function send(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!client) {
    // Demo fallback — log instead of send. Real emails require RESEND_API_KEY.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info(
        `[email/demo] → ${args.to} | ${args.subject}\n${args.text ?? args.html}`
      );
    }
    return { ok: true, demo: true };
  }
  const { data, error } = await client.emails.send({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[email/error]', error);
    return { ok: false, error };
  }
  return { ok: true, id: data?.id };
}

/* ---------- HTML shell ---------- */

function shell(title: string, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f4f4f4;padding:24px;color:#242424">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 8px rgba(36,36,36,0.05)">
    <div style="background:#101010;color:#ffffff;padding:24px 28px">
      <div style="font-weight:600;font-size:18px;letter-spacing:0.01em">Nigerian Army University, Biu</div>
      <div style="font-size:12px;opacity:0.7;margin-top:4px">Staff Leave Management System</div>
    </div>
    <div style="padding:28px">
      <h1 style="font-size:20px;margin:0 0 12px;font-weight:600;color:#242424">${title}</h1>
      ${body}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
      This is an automated message from NAUB LMS. Please do not reply directly.
    </div>
  </div>
</body></html>`;
}

function ctaButton(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:#101010;color:#ffffff;text-decoration:none;font-weight:500;padding:12px 24px;border-radius:9999px;margin:16px 0">${label}</a>`;
}

/* ---------- public email helpers ---------- */

export async function sendAccountApproved(to: string, name: string) {
  return send({
    to,
    subject: 'Your NAUB LMS account is approved',
    html: shell(
      'Account approved',
      `<p>Hello ${name},</p>
       <p>Your NAUB LMS account has been approved. You can now log in and start using the Staff Leave Management System.</p>
       ${ctaButton(`${APP_URL}/login`, 'Sign in to NAUB LMS')}`
    ),
  });
}

export async function sendAccountRejected(
  to: string,
  name: string,
  comment: string
) {
  return send({
    to,
    subject: 'Your NAUB LMS account was not approved',
    html: shell(
      'Account not approved',
      `<p>Hello ${name},</p>
       <p>Unfortunately your NAUB LMS account registration was not approved.</p>
       <p style="background:#fef2f2;border:1px solid #fecaca;padding:12px 16px;border-radius:8px;color:#991b1b"><strong>Admin comment:</strong> ${comment}</p>
       <p>If you believe this is a mistake, please contact your HR office.</p>`
    ),
  });
}

export async function sendLeaveSubmittedToHod(args: {
  hod: User;
  applicant: User;
  leaveType: LeaveType;
  application: LeaveApplication;
}) {
  return send({
    to: args.hod.email,
    subject: `Leave request from ${args.applicant.full_name}`,
    html: shell(
      'New leave request',
      `<p>Hello ${args.hod.full_name},</p>
       <p><strong>${args.applicant.full_name}</strong> has submitted a leave request that needs your review.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">
         <tr><td style="padding:8px 0;color:#6b7280">Leave type</td><td style="padding:8px 0;font-weight:500">${args.leaveType.name}</td></tr>
         <tr><td style="padding:8px 0;color:#6b7280">Start date</td><td style="padding:8px 0;font-weight:500">${args.application.start_date}</td></tr>
         <tr><td style="padding:8px 0;color:#6b7280">End date</td><td style="padding:8px 0;font-weight:500">${args.application.end_date}</td></tr>
         <tr><td style="padding:8px 0;color:#6b7280">Total days</td><td style="padding:8px 0;font-weight:500">${args.application.total_days}</td></tr>
         <tr><td style="padding:8px 0;color:#6b7280">Reason</td><td style="padding:8px 0">${args.application.reason}</td></tr>
       </table>
       ${ctaButton(`${APP_URL}/dashboard/hod/requests`, 'Review request')}`
    ),
  });
}

export async function sendHodDecision(args: {
  applicant: User;
  hr: User | null;
  application: LeaveApplication;
  leaveType: LeaveType;
  approved: boolean;
  comment: string | null;
}) {
  const subject = args.approved
    ? `Leave approved by HOD: ${args.leaveType.name}`
    : `Leave rejected by HOD: ${args.leaveType.name}`;
  return send({
    to: args.applicant.email,
    subject,
    html: shell(
      args.approved ? 'HOD approved your leave' : 'Leave request rejected',
      `<p>Hello ${args.applicant.full_name},</p>
       <p>${args.approved ? 'Your HOD has approved your leave request. It has been forwarded to HR for final approval.' : 'Your leave request was not approved by your HOD.'}</p>
       ${args.comment ? `<p style="background:#f4f4f4;padding:12px 16px;border-radius:8px"><strong>Comment:</strong> ${args.comment}</p>` : ''}
       ${args.approved && args.hr ? `<p>Final approver: ${args.hr.full_name}</p>` : ''}
       ${ctaButton(`${APP_URL}/dashboard/staff/my-leaves`, 'View request')}`
    ),
  });
}

export async function sendHrDecision(args: {
  applicant: User;
  hod: User;
  application: LeaveApplication;
  leaveType: LeaveType;
  approved: boolean;
  comment: string | null;
}) {
  return send({
    to: args.applicant.email,
    subject: args.approved
      ? `Leave fully approved: ${args.leaveType.name}`
      : `Leave rejected by HR: ${args.leaveType.name}`,
    html: shell(
      args.approved ? 'Leave approved' : 'Leave request rejected',
      `<p>Hello ${args.applicant.full_name},</p>
       <p>${args.approved ? 'Great news — HR has approved your leave request.' : 'HR has rejected your leave request.'}</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">
         <tr><td style="padding:8px 0;color:#6b7280">Leave type</td><td style="padding:8px 0;font-weight:500">${args.leaveType.name}</td></tr>
         <tr><td style="padding:8px 0;color:#6b7280">Start date</td><td style="padding:8px 0;font-weight:500">${args.application.start_date}</td></tr>
         <tr><td style="padding:8px 0;color:#6b7280">End date</td><td style="padding:8px 0;font-weight:500">${args.application.end_date}</td></tr>
         <tr><td style="padding:8px 0;color:#6b7280">Days</td><td style="padding:8px 0;font-weight:500">${args.application.total_days}</td></tr>
       </table>
       ${args.comment ? `<p style="background:#f4f4f4;padding:12px 16px;border-radius:8px"><strong>HR comment:</strong> ${args.comment}</p>` : ''}
       ${ctaButton(`${APP_URL}/dashboard/staff/my-leaves`, 'View request')}`
    ),
  });
}

export async function sendRotaPublished(args: {
  staff: User[];
  rotaTitle: string;
  department: string;
  periodStart: string;
  periodEnd: string;
}) {
  const subject = `New leave rota: ${args.department}`;
  const html = shell(
    'Departmental leave rota published',
    `<p>The departmental leave rota has been published.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0">
       <tr><td style="padding:8px 0;color:#6b7280">Title</td><td style="padding:8px 0;font-weight:500">${args.rotaTitle}</td></tr>
       <tr><td style="padding:8px 0;color:#6b7280">Department</td><td style="padding:8px 0;font-weight:500">${args.department}</td></tr>
       <tr><td style="padding:8px 0;color:#6b7280">Period</td><td style="padding:8px 0;font-weight:500">${args.periodStart} → ${args.periodEnd}</td></tr>
     </table>
     ${ctaButton(`${APP_URL}/dashboard/staff/rota`, 'View rota')}`
  );
  const results = await Promise.allSettled(
    args.staff.map((s) => send({ to: s.email, subject, html }))
  );
  return results;
}