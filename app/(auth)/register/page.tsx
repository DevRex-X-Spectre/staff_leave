import { redirect } from 'next/navigation';

/**
 * /register is no longer part of the flow — staff-ID accounts are provisioned
 * by HR/admin, not by self-signup. Old URLs redirect to /login.
 */
export default function RegisterPage(): never {
  redirect('/login');
}