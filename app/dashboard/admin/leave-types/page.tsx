import { LeaveTypes } from '@/lib/db';
import { AdminLeaveTypesClient } from './leave-types-client';
import type { LeaveType } from '@/types';

export default async function AdminLeaveTypesPage() {
  const leaveTypes = await LeaveTypes.all();
  return <AdminLeaveTypesClient leaveTypes={leaveTypes} />;
}
