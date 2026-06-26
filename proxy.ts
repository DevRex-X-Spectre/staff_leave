import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_COOKIE_NAME } from '@/lib/mock/session';
import { isSupabaseConfigured } from '@/lib/utils';
import { createServerClient } from '@supabase/ssr';

/**
 * Next.js 16 introduced the "Proxy" convention as the successor to
 * middleware.ts. It runs on every matching request and is the right
 * place to do optimistic auth checks + redirects.
 *
 * Logic:
 *  - Unauthenticated user hitting a /dashboard route → /login
 *  - Authenticated user with is_approved=false hitting a /dashboard
 *    route → /pending-approval
 *  - Authenticated user hitting /login or /register → /dashboard/{role}
 *  - Authenticated user hitting / → /dashboard/{role}
 *
 * Auth sources:
 *  - Supabase auth cookies when configured
 *  - Demo-mode cookie otherwise
 */

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/pending-approval'];
const PUBLIC_PREFIXES = ['/_next', '/api/auth', '/favicon', '/images', '/icons', '/public'];

function isProtected(pathname: string) {
  return pathname.startsWith('/dashboard');
}

function isPublicAsset(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function roleToDashboard(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'hod':
      return '/dashboard/hod';
    case 'hr_manager':
      return '/dashboard/hr';
    case 'staff':
      return '/dashboard/staff';
    default:
      return '/login';
  }
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isPublicAsset(pathname)) return NextResponse.next();

  const res = NextResponse.next({ request: { headers: req.headers } });

  // Resolve session — Supabase when configured, demo cookie otherwise.
  const useSupabase = isSupabaseConfigured();

  let isAuthed = false;
  let userRole: string | null = null;
  let isApproved = true;

  if (useSupabase) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(toSet) {
            toSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      isAuthed = true;
      const { data: profile } = await supabase
        .from('users')
        .select('role, is_approved')
        .eq('id', user.id)
        .single();
      userRole = profile?.role ?? null;
      isApproved = profile?.is_approved ?? true;
    }
  } else {
    // Demo mode — read the demo cookie
    const demoUserId = req.cookies.get(DEMO_COOKIE_NAME)?.value;
    if (demoUserId) {
      isAuthed = true;
      // Role and approval status will be enforced by the page-level DAL
      // which has access to the in-memory store. For routing purposes we
      // treat any demo cookie as a logged-in user.
      userRole = req.cookies.get('naub-demo-role')?.value ?? 'admin';
    }
  }

  // Protected route — require auth
  if (isProtected(pathname)) {
    if (!isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname + search);
      return NextResponse.redirect(url);
    }
    if (!isApproved) {
      const url = req.nextUrl.clone();
      url.pathname = '/pending-approval';
      return NextResponse.redirect(url);
    }
  }

  // Already logged in — don't show login/register
  if (
    isAuthed &&
    (pathname === '/login' || pathname === '/register' || pathname === '/')
  ) {
    const url = req.nextUrl.clone();
    url.pathname = roleToDashboard(userRole ?? 'staff');
    return NextResponse.redirect(url);
  }

  return res;
}

// Only run on routes that need auth checks; skip static and Next internals.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};