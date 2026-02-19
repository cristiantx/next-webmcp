# next-webmcp

Build WebMCP-powered Next.js App Router apps without fighting server/client boundaries.

`next-webmcp` wraps `@mcp-b/react-webmcp` with server-safe provider wiring, typed Server Action integration, navigation/search helpers, and an optional route metadata generator.

## Project Status

`next-webmcp` is experimental software and has not been proven in production environments yet. Expect breaking changes while the API and patterns mature.

## Why This Package

WebMCP + Next.js App Router can be awkward when tools span server actions, client hooks, and provider setup. This package gives you one consistent pattern for:

- registering tools in client components
- executing them safely in server actions
- keeping input/output validation in one shared contract
- exposing navigation and query helpers to MCP callers

## Highlights

- Server-safe `WebMCPProvider` for App Router layouts
- Automatic browser polyfill loading (`@mcp-b/global`) on the client
- Nested provider deduplication to avoid duplicate embedded agents
- Typed tool contracts + validated execution (`defineTool` + `executeTool`)
- App Router hooks: `useServerTool`, `useNavigationTool`, `useSearchParamsTool`
- Experimental route generator plugin (`withWebMCP`)

## Requirements

- `node >= 20`
- `next >= 15`
- `react >= 18.3`
- `react-dom >= 18.3`

## Install

```bash
npm install next-webmcp @mcp-b/react-webmcp zod
```

## Quick Start

### 1. Add the provider in a server layout

```tsx
// app/layout.tsx
import { WebMCPProvider } from 'next-webmcp';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WebMCPProvider appId="my-app">{children}</WebMCPProvider>
      </body>
    </html>
  );
}
```

No `'use client'` directive is required in the layout.

### 2. Define a shared tool contract (single source of truth)

```ts
// app/tools/definitions.ts
import { z } from 'zod';
import { defineTool } from 'next-webmcp/server';

export const createTaskTool = defineTool({
  name: 'create_task',
  description: 'Create a task in the server database',
  inputSchema: z.object({
    title: z.string().min(1),
    priority: z.enum(['low', 'medium', 'high']).default('medium')
  }),
  outputSchema: z.object({
    id: z.string(),
    success: z.boolean()
  })
});
```

### 3. Bind a validated handler in a Server Action file

```ts
// app/actions/mcp-tools.ts
'use server';

import { createToolContext, executeTool, type InferToolActionInput } from 'next-webmcp/server';
import { createTaskTool } from '../tools/definitions';

const getContext = createToolContext({
  getAuth: async () => ({ userId: 'demo-user' }),
  getMetadata: async () => ({ source: 'app-router-example' })
});

export async function createTaskAction(input: InferToolActionInput<typeof createTaskTool>) {
  return executeTool(
    createTaskTool,
    input,
    async ({ title, priority }, context) => {
      const id = `${context.auth?.userId ?? 'anon'}:${title}`;

      // Replace with your DB write.
      return { id: `${id}:${priority}`, success: true };
    },
    { getContext }
  );
}
```

### 4. Register the tool in a client component

```tsx
'use client';

import { useServerTool } from 'next-webmcp';
import { createTaskAction } from '../actions/mcp-tools';
import { createTaskTool } from '../tools/definitions';

export function TaskTools() {
  useServerTool(createTaskTool, createTaskAction);
  return null;
}
```

Flow:

`defineTool` -> `useServerTool` -> Server Action -> `executeTool` -> validated result

## API Reference

### `WebMCPProvider`

```tsx
<WebMCPProvider
  appId="my-app"
  agent={false}
  injectPolyfill={true}
>
  {children}
</WebMCPProvider>
```

Props:

- `appId: string` - app identifier passed to custom agent components
- `children: ReactNode`
- `agent?: false | { enabled?: boolean; component?: ComponentType; loader?: () => Promise<{ default: ComponentType }>; props?: Record<string, unknown> }`
- `injectPolyfill?: boolean` (default `true`)
- `onPolyfillError?: (error: unknown) => void`

### `defineTool`

```ts
defineTool({
  name,
  description,
  inputSchema: z.object(...),
  outputSchema: z.object(...)
})
```

### `executeTool` (recommended)

```ts
export async function action(input: InferToolActionInput<typeof tool>) {
  return executeTool(tool, input, handler, {
    getContext: async () => ({ ... })
  });
}
```

- Validates input with `tool.inputSchema`
- Executes server handler
- Validates output when `outputSchema` is provided
- Throws `ToolExecutionError` with codes:
  - `INVALID_INPUT`
  - `HANDLER_ERROR`
  - `INVALID_OUTPUT`

### `createToolAction` (compatibility helper)

`createToolAction` is still available, but in Next.js App Router the top-level exported server action pattern with `executeTool` is safer.

### `useServerTool`

```ts
useServerTool(tool, serverAction, {
  enabled: true,
  onSuccess(result, input) {},
  onError(error, input) {}
});
```

### `useNavigationTool`

```ts
useNavigationTool({
  routes: [
    { path: '/dashboard/[id]', params: z.object({ id: z.string() }) },
    { path: '/settings', description: 'User settings' }
  ]
});
```

### `useSearchParamsTool`

```ts
useSearchParamsTool({
  name: 'get_search_params'
});
```

Returns pathname + normalized query params to the MCP caller.

## Experimental Plugin

`withWebMCP` can generate route metadata from your `app/` tree.

```ts
// next.config.mjs
import { withWebMCP } from 'next-webmcp/plugin';

const nextConfig = {
  reactStrictMode: true
};

export default withWebMCP(nextConfig, {
  routes: {
    enabled: true,
    appDir: './app',
    outFile: './.next-webmcp/routes.generated.ts',
    basePath: '/dashboard'
  }
});
```

The generated file exports:

- `generatedNavigationRoutes`
- `generatedRoutePathMap`

## Example App

See `examples/app-router-example` for a complete flow with:

- root provider
- shared tool definitions
- `'use server'` action binding
- client-side tool registration
- navigation and search params hooks

## Troubleshooting

- Duplicate provider warning in dev: only one top-level provider should own polyfill/agent mounting.
- Missing `navigator.modelContext`: keep `injectPolyfill` enabled or manually load `@mcp-b/global`.
- Hook in server component error: move `useServerTool`, `useNavigationTool`, and `useSearchParamsTool` to client components.
- Server Action import issues: export actions from `'use server'` files and import them into client components directly.

## Contributing

Contributions and suggestions are welcome.

- Open an issue for bugs, questions, ideas, or API feedback.
- Open a pull request for fixes, docs, tests, or new helpers.
- For behavior changes, include tests or a minimal reproduction.
- Keep PRs focused and include a short rationale in the description.

## License

MIT
