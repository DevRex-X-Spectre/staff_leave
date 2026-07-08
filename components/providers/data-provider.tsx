'use client';

import { useEffect, type ReactNode } from 'react';
import { hydrateStore } from '@/lib/local/store';

/**
 * DataProvider - ensures the localStorage store has been hydrated before any
 * child component reads from it. Mounting this provider is enough to seed
 * the store on first visit; reads via hooks in `lib/local/data-hooks.ts`
 * pick up the data immediately afterwards.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    hydrateStore();
  }, []);
  return <>{children}</>;
}