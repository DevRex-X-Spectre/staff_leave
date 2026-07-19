import { handlers } from '@/auth';

// Auth.js reads cookies and request headers, so these endpoints must always run
// at request time. Explicitly marking the catch-all route as dynamic also keeps
// Next.js/Turbopack from treating it like a static route during development.
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;
