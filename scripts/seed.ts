/**
 * NAUB LMS database seed.
 *
 * Seeds only required reference data and real-looking staff accounts. It does
 * not create sample leave applications, approvals, rotas, notifications, or
 * account requests. Every account gets the default password `NAUB@2026`.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

function loadEnv(file: string) {
  try {
    const text = readFileSync(resolve(process.cwd(), file), 'utf8');
    for (const line of text.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match || match[1].startsWith('#')) continue;
      const value = (match[2] ?? '').trim().replace(/^['"]|['"]$/g, '');
      if (!(match[1] in process.env)) process.env[match[1]] = value;
    }
  } catch {
    // Environment files are optional when values are supplied by the shell.
  }
}

loadEnv('.env.local');
loadEnv('.env');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('\nMissing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local, then re-run.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEFAULT_PASSWORD = 'NAUB@2026';
const YEAR = new Date().getFullYear();
const nowIso = '2026-01-04T08:00:00Z';

const U = {
  admin: '00000000-0000-0000-0000-000000000001',
  registrar: '00000000-0000-0000-0000-000000000002',
  hodCs: '00000000-0000-0000-0000-000000000003',
  hodAdmin: '00000000-0000-0000-0000-000000000004',
  hodRegistry: '00000000-0000-0000-0000-000000000005',
  staffCsJunior: '00000000-0000-0000-0000-000000000010',
  staffCsSenior: '00000000-0000-0000-0000-000000000011',
  staffAdminJunior: '00000000-0000-0000-0000-000000000012',
  staffRegistrySenior: '00000000-0000-0000-0000-000000000013',
} as const;

const D = {
  cs: '10000000-0000-0000-0000-000000000001',
  admin: '10000000-0000-0000-0000-000000000002',
  registry: '10000000-0000-0000-0000-000000000003',
  maths: '10000000-0000-0000-0000-000000000004',
  physics: '10000000-0000-0000-0000-000000000005',
} as const;

const LT = {
  annual: '20000000-0000-0000-0000-000000000001',
  sick: '20000000-0000-0000-0000-000000000002',
  casual: '20000000-0000-0000-0000-000000000003',
  maternity: '20000000-0000-0000-0000-000000000004',
  paternity: '20000000-0000-0000-0000-000000000005',
  study: '20000000-0000-0000-0000-000000000006',
  compassionate: '20000000-0000-0000-0000-000000000007',
} as const;

const legacy = {
  applications: [
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000005',
  ],
  notifications: [
    '60000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000004',
  ],
  rota: '50000000-0000-0000-0000-000000000001',
  userApprovalRequest: '70000000-0000-0000-0000-000000000001',
  pendingUser: '00000000-0000-0000-0000-000000000020',
};

const departments = [
  { id: D.cs, name: 'Computer Science', hod_id: null, created_at: nowIso },
  { id: D.admin, name: 'Administration', hod_id: null, created_at: nowIso },
  { id: D.registry, name: 'Registry', hod_id: null, created_at: nowIso },
  { id: D.maths, name: 'Mathematics', hod_id: null, created_at: nowIso },
  { id: D.physics, name: 'Physics', hod_id: null, created_at: nowIso },
];

const users = [
  { id: U.admin, full_name: 'System Administrator', email: 'admin@naub.edu.ng', phone: '+234 800 000 0001', staff_id: 'NAUB/ADM/SN001', role: 'admin', staff_type: 'non_academic', staff_grade: 'senior', rank: 'Principal Administrative Officer', department_id: D.admin, is_approved: true, is_active: true, created_at: nowIso, updated_at: nowIso },
  { id: U.registrar, full_name: 'Amina Bello', email: 'registrar@naub.edu.ng', phone: '+234 800 000 0002', staff_id: 'NAUB/REG/SN001', role: 'hr_manager', staff_type: 'non_academic', staff_grade: 'senior', rank: 'Deputy Registrar', department_id: D.registry, is_approved: true, is_active: true, created_at: nowIso, updated_at: nowIso },
  { id: U.hodCs, full_name: 'Prof. Chukwuma Okeke', email: 'hod.cs@naub.edu.ng', phone: '+234 800 000 0003', staff_id: 'NAUB/CS/001', role: 'hod', staff_type: 'academic', staff_grade: null, rank: 'Professor', department_id: D.cs, is_approved: true, is_active: true, created_at: nowIso, updated_at: nowIso },
  { id: U.hodAdmin, full_name: 'Mrs. Funke Adeyemi', email: 'hod.admin@naub.edu.ng', phone: '+234 800 000 0004', staff_id: 'NAUB/ADM/SN002', role: 'hod', staff_type: 'non_academic', staff_grade: 'senior', rank: 'Principal Assistant Registrar', department_id: D.admin, is_approved: true, is_active: true, created_at: nowIso, updated_at: nowIso },
  { id: U.hodRegistry, full_name: 'Mr. Bashir Mohammed', email: 'hod.registry@naub.edu.ng', phone: '+234 800 000 0005', staff_id: 'NAUB/REG/SN002', role: 'hod', staff_type: 'non_academic', staff_grade: 'senior', rank: 'Assistant Registrar', department_id: D.registry, is_approved: true, is_active: true, created_at: nowIso, updated_at: nowIso },
  { id: U.staffCsJunior, full_name: 'Engr. Samuel Adekunle', email: 'samuel.adekunle@naub.edu.ng', phone: '+234 800 000 0010', staff_id: 'NAUB/CS/010', role: 'staff', staff_type: 'academic', staff_grade: null, rank: 'Lecturer II', department_id: D.cs, is_approved: true, is_active: true, created_at: nowIso, updated_at: nowIso },
  { id: U.staffCsSenior, full_name: 'Dr. Halima Yusuf', email: 'halima.yusuf@naub.edu.ng', phone: '+234 800 000 0011', staff_id: 'NAUB/CS/011', role: 'staff', staff_type: 'academic', staff_grade: null, rank: 'Senior Lecturer', department_id: D.cs, is_approved: true, is_active: true, created_at: nowIso, updated_at: nowIso },
  { id: U.staffAdminJunior, full_name: 'Mr. Tunde Bakare', email: 'tunde.bakare@naub.edu.ng', phone: '+234 800 000 0012', staff_id: 'NAUB/ADM/JS001', role: 'staff', staff_type: 'non_academic', staff_grade: 'junior', rank: 'Administrative Officer', department_id: D.admin, is_approved: true, is_active: true, created_at: nowIso, updated_at: nowIso },
  { id: U.staffRegistrySenior, full_name: 'Mrs. Zainab Ibrahim', email: 'zainab.ibrahim@naub.edu.ng', phone: '+234 800 000 0013', staff_id: 'NAUB/REG/SN003', role: 'staff', staff_type: 'non_academic', staff_grade: 'senior', rank: 'Senior Administrative Officer', department_id: D.registry, is_approved: true, is_active: true, created_at: nowIso, updated_at: nowIso },
];

const leaveTypes = [
  { id: LT.annual, name: 'Annual Leave', applicable_to: 'both', max_days_academic: 30, max_days_non_academic: 30, requires_document: false, is_active: true, created_at: nowIso },
  { id: LT.sick, name: 'Sick Leave', applicable_to: 'both', max_days_academic: 14, max_days_non_academic: 14, requires_document: true, is_active: true, created_at: nowIso },
  { id: LT.casual, name: 'Casual Leave', applicable_to: 'both', max_days_academic: 7, max_days_non_academic: 7, requires_document: false, is_active: true, created_at: nowIso },
  { id: LT.maternity, name: 'Maternity Leave', applicable_to: 'non_academic', max_days_academic: null, max_days_non_academic: 90, requires_document: true, is_active: true, created_at: nowIso },
  { id: LT.paternity, name: 'Paternity Leave', applicable_to: 'both', max_days_academic: 7, max_days_non_academic: 7, requires_document: false, is_active: true, created_at: nowIso },
  { id: LT.study, name: 'Study Leave', applicable_to: 'academic', max_days_academic: 365, max_days_non_academic: null, requires_document: true, is_active: true, created_at: nowIso },
  { id: LT.compassionate, name: 'Compassionate Leave', applicable_to: 'both', max_days_academic: 7, max_days_non_academic: 7, requires_document: false, is_active: true, created_at: nowIso },
];

function entitlementTotal(user: typeof users[number], leaveType: typeof leaveTypes[number]): number | null {
  if (leaveType.applicable_to !== 'both' && leaveType.applicable_to !== user.staff_type) return null;
  if (leaveType.id === LT.annual) return user.staff_type === 'academic' || user.staff_grade === 'senior' ? 30 : 21;
  return user.staff_type === 'academic' ? leaveType.max_days_academic : leaveType.max_days_non_academic;
}

async function check(label: string, error: unknown) {
  if (error) throw new Error(`${label} failed: ${JSON.stringify(error)}`);
  console.log(`✓ ${label}`);
}

async function upsert(table: string, rows: Record<string, unknown>[], onConflict: string) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  await check(`${table} (${rows.length} rows)`, error);
}

async function removeLegacyMockData() {
  await check('legacy user approval request', (await supabase.from('user_approval_requests').delete().eq('id', legacy.userApprovalRequest)).error);
  await check('legacy notifications', (await supabase.from('notifications').delete().in('id', legacy.notifications)).error);
  await check('legacy rota', (await supabase.from('leave_rota').delete().eq('id', legacy.rota)).error);
  // approvals cascade when their applications are deleted.
  await check('legacy leave applications', (await supabase.from('leave_applications').delete().in('id', legacy.applications)).error);
  await check('legacy pending credentials', (await supabase.from('user_credentials').delete().eq('user_id', legacy.pendingUser)).error);
  await check('legacy pending user', (await supabase.from('users').delete().eq('id', legacy.pendingUser)).error);
}

async function main() {
  console.log(`\nSeeding NAUB LMS reference data (year=${YEAR})...\n`);
  await removeLegacyMockData();

  await upsert('departments', departments, 'id');
  await upsert('users', users, 'id');

  const hodMap: Record<string, string> = {
    [D.cs]: U.hodCs,
    [D.admin]: U.hodAdmin,
    [D.registry]: U.hodRegistry,
  };
  for (const [departmentId, hodId] of Object.entries(hodMap)) {
    await check(`HOD for ${departmentId}`, (await supabase.from('departments').update({ hod_id: hodId }).eq('id', departmentId)).error);
  }

  await upsert('leave_types', leaveTypes, 'id');
  const entitlements = users.flatMap((user) => leaveTypes.flatMap((leaveType) => {
    const total = entitlementTotal(user, leaveType);
    return total && total > 0 ? [{ user_id: user.id, leave_type_id: leaveType.id, year: YEAR, total_days: total, used_days: 0 }] : [];
  }));
  await upsert('leave_entitlements', entitlements, 'user_id,leave_type_id,year');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await upsert('user_credentials', users.map((user) => ({ user_id: user.id, password_hash: passwordHash, updated_at: new Date().toISOString() })), 'user_id');

  console.log(`\n✓ Clean seed complete. No sample leave transactions were created.\n  Sign in with NAUB/ADM/SN001 / ${DEFAULT_PASSWORD}\n`);
}

main().catch((error) => {
  console.error('\nSeed failed:', error);
  process.exit(1);
});
