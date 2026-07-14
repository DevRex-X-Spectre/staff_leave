import { UAR } from '@/lib/db';
import { AdminApprovalsClient } from './approvals-client';
import type { UserApprovalRequestWithRelations } from '@/types';

export default async function AdminApprovalsPage() {
  const requests = await UAR.all();
  return <AdminApprovalsClient requests={requests} />;
}
