import { auth } from '@/auth';
import { Applications, Departments, LeaveTypes, Slots, Users } from '@/lib/db';
import { ApplyLeaveClient } from './apply-client';
import type { Department, LeaveBalance, LeaveType, User } from '@/types';

export default async function ApplyLeavePage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const departmentId = session?.user?.departmentId ?? '';

  const [leaveTypes, balances, department, applicant, deptUsers, slots] = await Promise.all([
    LeaveTypes.active(),
    Applications.leaveBalances(userId),
    Departments.byId(departmentId),
    Users.byId(userId),
    Users.byDepartment(departmentId),
    Slots.byDepartment(departmentId),
  ]);

  // Cover candidates: active, non-admin colleagues in the same department.
  const coverCandidates: User[] = deptUsers.filter(
    (u) => u.id !== userId && u.is_active && u.role !== 'admin'
  );

  // Slot ranges for the client-side rota-conflict warning (authoritative check
  // also runs in the applyLeaveAction server action).
  const slotRanges = slots.map((s) => ({ slot_start: s.slot_start, slot_end: s.slot_end }));

  return (
    <ApplyLeaveClient
      leaveTypes={leaveTypes}
      balances={balances}
      department={department}
      applicant={applicant}
      coverCandidates={coverCandidates}
      slotRanges={slotRanges}
    />
  );
}
