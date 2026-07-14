'use client';

import { jsPDF } from 'jspdf';
import type { LeaveApplicationWithRelations, LeaveApproval } from '@/types';
import { formatDate } from '@/lib/utils';

const PAGE_WIDTH = 210;
const LEFT = 18;
const RIGHT = PAGE_WIDTH - LEFT;

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

function addForm1A(doc: jsPDF, application: LeaveApplicationWithRelations, approvals: LeaveApproval[]) {
  const hod = approvalFor(approvals, 'hod');
  const registrar = approvalFor(approvals, 'hr_manager');
  let y = 15;

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

function addApprovalLetter(doc: jsPDF, application: LeaveApplicationWithRelations, approvals: LeaveApproval[]) {
  const registrar = approvalFor(approvals, 'hr_manager');
  let y = 22;

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
  // @ts-expect-error jspdf-autotable augments jsPDF at runtime.
  doc.autoTable({ head: [['Detail', 'Approved information']], body: details, startY: y, theme: 'grid', styles: { fontSize: 9, cellPadding: 2 } });
  // @ts-expect-error jspdf-autotable augments jsPDF at runtime.
  y = (doc.lastAutoTable?.finalY ?? y) + 14;

  doc.text(`Registrar's comment: ${registrar?.comment || 'Approved.'}`, LEFT, y, { maxWidth: RIGHT - LEFT });
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text('Registrar', RIGHT, y, { align: 'right' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Nigerian Army University Biu', RIGHT, y, { align: 'right' });
}

export function downloadLeaveApprovalPdf(
  application: LeaveApplicationWithRelations,
  approvals: LeaveApproval[] = []
) {
  if (application.status !== 'approved') {
    throw new Error('Only fully approved leave applications can be downloaded.');
  }
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  if (isCasual(application)) addForm1A(doc, application, approvals);
  else addApprovalLetter(doc, application, approvals);
  const safeStaffId = applicantStaffId(application).replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
  doc.save(`naub-${isCasual(application) ? 'form-1a' : 'leave-approval'}-${safeStaffId || application.id}.pdf`);
}
