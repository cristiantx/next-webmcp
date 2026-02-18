'use client';

import type { ReactNode } from 'react';

import { WebMCPProvider as NextWebMCPProvider } from 'next-webmcp';

export function WebMCPProvider({ children }: { children: ReactNode }) {
  return <NextWebMCPProvider appId="app-router-example">{children}</NextWebMCPProvider>;
}
