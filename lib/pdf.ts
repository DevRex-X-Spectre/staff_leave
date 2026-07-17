'use client';

import { jsPDF } from 'jspdf';
// jspdf-autotable@5 is a standalone plugin — it must be explicitly attached
// to the jsPDF class (in jspdf@4 the plugin no longer auto-registers itself).
// applyPlugin() monkey-patches jsPDF.prototype so `doc.autoTable(...)` works.
import { applyPlugin } from 'jspdf-autotable';
import type { LeaveApplicationWithRelations, LeaveApproval } from '@/types';
import { formatDate } from '@/lib/utils';

// Reflect the runtime monkey-patch in the type system so call sites stay clean.
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => void;
    lastAutoTable?: { finalY: number };
  }
}

applyPlugin(jsPDF);

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const LEFT = 18;
const RIGHT = PAGE_WIDTH - LEFT;

const LOGO_URL = '/naub-logo.png';
const HEADER_LOGO_MM = 20; // header size (square)
const HEADER_LOGO_TOP_MM = 6; // distance from top edge
const WATERMARK_SIZE_MM = 130; // faint watermark behind content

// ---------------------------------------------------------------------------
// Logo loading. jsPDF.addImage needs either an HTMLImageElement or a data URL.
// We cache the result so we only fetch + decode the PNG once per page session.
// ---------------------------------------------------------------------------
let logoCache: Promise<{ dataUrl: string; width: number; height: number }> | null = null;

function loadLogo(): Promise<{ dataUrl: string; width: number; height: number }> {
  if (logoCache) return logoCache;
  logoCache = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Round to even dims so jsPDF's PNG encoder is happy.
      const w = Math.round(img.naturalWidth / 2) * 2;
      const h = Math.round(img.naturalHeight / 2) * 2;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context for logo.'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      // toDataURL never taints because the image was loaded crossOrigin=anonymous.
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: w, height: h });
    };
    img.onerror = () => reject(new Error('Could not load ' + LOGO_URL));
    img.src = LOGO_URL;
  });
  return logoCache;
}

/** Place the centered header logo at the top of the FIRST page only. */
function addHeaderLogo(doc: jsPDF, dataUrl: string, w: number, h: number) {
  const drawW = HEADER_LOGO_MM;
  const drawH = HEADER_LOGO_MM * (h / w); // preserve aspect ratio
  const x = (PAGE_WIDTH - drawW) / 2;
  doc.addImage(dataUrl, 'PNG', x, HEADER_LOGO_TOP_MM, drawW, drawH, undefined, 'FAST');
  return HEADER_LOGO_TOP_MM + drawH;
}

interface JspdfGStateCtor {
  new (opts: { opacity: number }): unknown;
}

/** Place a faint, large, centered watermark behind the page content. */
function addWatermark(doc: jsPDF, dataUrl: string, w: number, h: number) {
  const drawSize = WATERMARK_SIZE_MM;
  const drawH = WATERMARK_SIZE_MM * (h / w);
  const x = (PAGE_WIDTH - drawSize) / 2;
  const y = (PAGE_HEIGHT - drawH) / 2;
  // jsPDF 4.x exposes GState globally; cast through unknown because the bundled
  // type defs don't include it.
  const GState = (doc as unknown as { GState?: JspdfGStateCtor }).GState
    ?? ((jsPDF as unknown as { GState?: JspdfGStateCtor }).GState);
  if (GState) {
    // setGState is fluent at runtime; the type defs omit it, so cast.
    (doc as unknown as { setGState: (s: unknown) => void }).setGState(new GState({ opacity: 0.06 }));
  }
  doc.addImage(dataUrl, 'PNG', x, y, drawSize, drawH, undefined, 'FAST');
  if (GState) {
    (doc as unknown as { setGState: (s: unknown) => void }).setGState(new GState({ opacity: 1 }));
  }
}

function valueOrLine(value: string | null | undefined): string {
  return value?.trim() || '____________________________';
}

function approvalFor(
  approvals: LeaveApproval[],
  role: 'hod' | 'hr_manager'
): LeaveApproval | undefined {
  return approvals.find((approval) => approval.approver_role === role);
}

function isCasual(application: LeaveApplicationWithRelations): boolean {
  return application.leave_type?.name.toLowerCase() === 'casual leave';
}

function applicantName(application: LeaveApplicationWithRelations): string {
  return application.applicant_name ?? application.applicant?.full_name ?? 'Applicant';
}

function applicantStaffId(application: LeaveApplicationWithRelations): string {
  return application.applicant_staff_id ?? application.applicant?.staff_id ?? '-';
}

function applicantRank(application: LeaveApplicationWithRelations): string {
  return application.applicant_rank ?? application.applicant?.rank ?? '-';
}

function financeLabel(value: LeaveApproval['how_financed'] | undefined): string {
  switch (value) {
    case 'department': return 'Department';
    case 'university': return 'University';
    case 'applicant': return 'Applicant';
    default: return 'Not stated';
  }
}

function writeFormLine(doc: jsPDF, y: number, number: string, label: string, value: string, maxWidth = 104): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.text(`${number}. ${label}:`, LEFT + 4, y);
  doc.setFont('helvetica', 'bold');
  const lines = doc.splitTextToSize(value, maxWidth) as string[];
  doc.text(lines, LEFT + 55, y);
  const bottom = y + Math.max(0, lines.length - 1) * 4.3;
  doc.setDrawColor(80);
  doc.setLineWidth(0.15);
  doc.line(LEFT + 55, bottom + 1.6, RIGHT - 2, bottom + 1.6);
  return bottom + 7;
}

function addForm1A(doc: jsPDF, application: LeaveApplicationWithRelations, approvals: LeaveApproval[], headerHeight: number) {
  const hod = approvalFor(approvals, 'hod');
  const registrar = approvalFor(approvals, 'hr_manager');
  let y = headerHeight + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NIGERIAN ARMY UNIVERSITY BIU', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 5;
  doc.text('(OFFICE OF THE REGISTRAR)', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.text('FORM 1A', LEFT, y);
  doc.setFontSize(9);
  doc.text(`STAFF NO: ${applicantStaffId(application)}`, RIGHT, y, { align: 'right' });
  y += 7;
  doc.setFontSize(10);
  doc.text('APPLICATION FOR CASUAL/SHORT LEAVE FROM THE UNIVERSITY', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.text('(To be completed in four copies)', LEFT, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Part I: TO BE COMPLETED BY APPLICANT', LEFT, y);
  y += 6;

  y = writeFormLine(doc, y, '1', 'Name of Applicant', applicantName(application));
  y = writeFormLine(doc, y, '2', 'Department & Post', `${valueOrLine(application.department?.name)} / ${valueOrLine(applicantRank(application))}`);
  y = writeFormLine(doc, y, '3', 'Period of Absence', `${formatDate(application.start_date)} to ${formatDate(application.end_date)} (${application.total_days} working day${application.total_days === 1 ? '' : 's'})`);
  y = writeFormLine(doc, y, '4', 'Destination', valueOrLine(application.destination));
  y = writeFormLine(doc, y, '5', 'Reason(s) for Absence', valueOrLine(application.reason), 104);
  y = writeFormLine(doc, y, '6', 'Person responsible for duties during absence (if any)', valueOrLine(application.cover_staff?.full_name), 78);
  y = writeFormLine(doc, y, '7', 'Signature of Applicant', 'Submitted electronically');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.text(`Date: ${formatDate(application.created_at)}`, RIGHT, y - 5, { align: 'right' });
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Part II: TO BE COMPLETED BY THE HEAD OF DEPARTMENT OR DEAN', LEFT, y);
  y += 6;
  y = writeFormLine(doc, y, 'a', 'Comment by Head of Department', valueOrLine(hod?.comment));
  y = writeFormLine(doc, y, 'b', 'How Financed', financeLabel(hod?.how_financed));
  y = writeFormLine(doc, y, 'c', 'Signature of Head of Department', hod ? `Decision recorded ${formatDate(hod.decided_at)}` : '____________________________');
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Part III: TO BE COMPLETED BY THE REGISTRAR', LEFT, y);
  y += 6;
  y = writeFormLine(doc, y, 'a', 'Leave of Absence Approved/Not Approved', application.status === 'approved' ? 'APPROVED' : 'NOT APPROVED');
  y = writeFormLine(doc, y, 'b', 'How financed', financeLabel(registrar?.how_financed));
  y = writeFormLine(doc, y, 'c', 'Vice-Chancellor/Registrar Signature & Date', registrar ? `Approved electronically - ${formatDate(registrar.decided_at)}` : '____________________________');
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.text('NB: (a) Please note that casual leave of more than 7 days per session will be deducted from the applicant\'s annual leave.', LEFT, y, { maxWidth: RIGHT - LEFT });
  y += 8;
  doc.text('(b) Casual leave not funded by the University may be approved by the Registrar.', LEFT, y, { maxWidth: RIGHT - LEFT });
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Copy to: VC     Bursary     Dean     HOD', LEFT, y);
}

function addApprovalLetter(doc: jsPDF, application: LeaveApplicationWithRelations, approvals: LeaveApproval[], headerHeight: number) {
  const registrar = approvalFor(approvals, 'hr_manager');
  let y = headerHeight + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('NIGERIAN ARMY UNIVERSITY BIU', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.text('OFFICE OF THE REGISTRAR', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 14;

  doc.setFontSize(11);
  doc.text('LEAVE APPROVAL', LEFT, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Staff No: ${applicantStaffId(application)}`, LEFT, y);
  doc.text(`Date: ${registrar ? formatDate(registrar.decided_at) : formatDate(application.updated_at)}`, RIGHT, y, { align: 'right' });
  y += 13;

  const subject = `APPROVAL OF ${application.leave_type?.name?.toUpperCase() ?? 'LEAVE'}`;
  doc.setFont('helvetica', 'bold');
  doc.text(subject, LEFT, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  const opening = `This is to confirm that the leave application of ${applicantName(application)}, ${applicantRank(application)} in the ${application.department?.name ?? 'assigned'} Department, has been approved.`;
  const openingLines = doc.splitTextToSize(opening, RIGHT - LEFT) as string[];
  doc.text(openingLines, LEFT, y);
  y += openingLines.length * 5.2 + 7;

  const details = [
    ['Leave type', application.leave_type?.name ?? '-'],
    ['Period of absence', `${formatDate(application.start_date)} to ${formatDate(application.end_date)}`],
    ['Working days', String(application.total_days)],
    ['Reason', application.reason],
    ['Covering staff', application.cover_staff?.full_name ?? 'Not specified'],
  ];
  if (application.destination) details.splice(3, 0, ['Destination', application.destination]);
  doc.autoTable({ head: [['Detail', 'Approved information']], body: details, startY: y, theme: 'grid', styles: { fontSize: 9, cellPadding: 2 } });
  y = (doc.lastAutoTable?.finalY ?? y) + 14;

  doc.text(`Registrar's comment: ${registrar?.comment || 'Approved.'}`, LEFT, y, { maxWidth: RIGHT - LEFT });
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text('Registrar', RIGHT, y, { align: 'right' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Nigerian Army University Biu', RIGHT, y, { align: 'right' });
}

export async function downloadLeaveApprovalPdf(
  application: LeaveApplicationWithRelations,
  approvals: LeaveApproval[] = []
) {
  if (application.status !== 'approved') {
    throw new Error('Only fully approved leave applications can be downloaded.');
  }

  const logo = await loadLogo();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Step 1: lay down the watermark first on every page. addWatermark draws
  // it centered with low opacity on the current page; for a single-page
  // document (the common case here) this is enough. We re-add it on any
  // overflow page below.
  addWatermark(doc, logo.dataUrl, logo.width, logo.height);

  // Step 2: header logo + content.
  const headerBottom = addHeaderLogo(doc, logo.dataUrl, logo.width, logo.height);
  if (isCasual(application)) addForm1A(doc, application, approvals, headerBottom);
  else addApprovalLetter(doc, application, approvals, headerBottom);

  // Step 3: if jsPDF created any overflow pages, add the watermark to each.
  // (Header logo is only on page 1 by design.)
  const pageCount = doc.getNumberOfPages();
  for (let p = 2; p <= pageCount; p++) {
    doc.setPage(p);
    addWatermark(doc, logo.dataUrl, logo.width, logo.height);
  }

  const safeStaffId = applicantStaffId(application).replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
  doc.save(`naub-${isCasual(application) ? 'form-1a' : 'leave-approval'}-${safeStaffId || application.id}.pdf`);
}