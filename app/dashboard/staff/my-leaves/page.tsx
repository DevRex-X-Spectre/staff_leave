import { requireUser } from '@/lib/auth';
import { listApplicationsByUser } from '@/lib/data/dal';
import { MyLeavesClient } from './my-leaves-client';

export default async function MyLeavesPage() {
  const user = await requireUser();
  const applications = await listApplicationsByUser(user.id);
  return <MyLeavesClient initialApplications={applications as Parameters<typeof MyLeavesClient>[0]['initialApplications']} />;
}