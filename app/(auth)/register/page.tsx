import { redirect } from 'next/navigation';

/**
 * /register is no longer part of the flow. Staff-ID accounts are provisioned
 * by the Registrar/admin, not by self-signup. Old URLs redirect to /login.
 */
export default function RegisterPage(): never {
  redirect('/login');
}