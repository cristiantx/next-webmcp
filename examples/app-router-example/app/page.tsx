import { Suspense } from 'react';

import { ClientTools } from './components/client-tools';

export default function HomePage() {
  return (
    <main>
      <Suspense fallback={null}>
        <ClientTools />
      </Suspense>
      <h1>next-webmcp example</h1>
      <p>Use your MCP-enabled client to invoke registered tools.</p>
    </main>
  );
}
