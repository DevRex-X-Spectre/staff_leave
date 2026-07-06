'use client';

import { useAuth } from '@/components/providers/auth-provider';
import {
  useApplications,
  useRotasByDepartment,
  useRotaSlotsByDepartment,
} from '@/lib/local/data-hooks';
import { HodCalendarClient } from './hod-calendar-client';

/**
 * HOD calendar page (client). Reads rota + applications + slots from the
 * localStorage store via hooks, keyed on the HOD's department.
 */
export default function HodCalendarPage() {
  const { currentUser, ready } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-[var(--text-tertiary)]">
        Loading…
      </div>
    );
  }
  if (!currentUser) return null;

  if (!currentUser.department_id) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-[20px] font-semibold">No department assigned</h1>
      </div>
    );
  }

  const applications = useApplications({
    departmentId: currentUser.department_id,
  });
  const rotas = useRotasByDepartment(currentUser.department_id);
  const slots = useRotaSlotsByDepartment(currentUser.department_id);

  return (
    <HodCalendarClient
      applications={applications}
      rotas={rotas}
      slots={slots}
    />
  );
}