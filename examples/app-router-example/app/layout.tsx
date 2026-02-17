import type { ReactNode } from 'react';

import { WebMCPProvider } from 'next-webmcp';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WebMCPProvider appId="app-router-example">{children}</WebMCPProvider>
      </body>
    </html>
  );
}
