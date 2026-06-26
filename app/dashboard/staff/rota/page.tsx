import { requireUser } from '@/lib/auth';
import { listRotaSlotsByDepartment } from '@/lib/data/dal';
import { StaffRotaClient } from './staff-rota-client';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/utils';
import { Users } from '@/lib/mock/store';
import type { RotaSlot } from '@/types';

type RotaRow = {
  slot_start: string;
  slot_end: string;
  leave_type_id: string | null;
};

export default async function StaffRotaPage() {
  const user = await requireUser();

  // Resolve department. If a staff user has no department we show an empty state.
  const departmentId = user.department_id;

  let slots: RotaRow[] = [];
  if (departmentId) {
    const data = (await listRotaSlotsByDepartment(departmentId)) as RotaSlot[];
    slots = data.map((s) => ({
      slot_start: s.slot_start,
      slot_end: s.slot_end,
      leave_type_id: s.leave_type_id,
    }));
  }

  // Resolve department member count (for "X of Y on leave" stat).
  let departmentSize = 0;
  if (departmentId) {
    if (isDemoMode()) {
      departmentSize = Users.all()
        .filter((u) => u.department_id === departmentId && u.is_active && u.is_approved)
        .length;
    } else {
      const sb = await getSupabaseServerClient();
      const { count } = await sb
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .eq('is_approved', true);
      departmentSize = count ?? 0;
    }
  }

  return (
    <StaffRotaClient
      slots={slots}
      departmentSize={departmentSize}
      departmentId={departmentId}
    />
  );
}