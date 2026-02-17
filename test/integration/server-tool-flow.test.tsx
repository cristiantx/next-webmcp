import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { useNavigationTool } from '../../src/hooks/use-navigation-tool.js';
import { useSearchParamsTool } from '../../src/hooks/use-search-params-tool.js';
import { useServerTool } from '../../src/hooks/use-server-tool.js';
import { createToolAction } from '../../src/server/create-tool-action.js';
import { createToolContext } from '../../src/server/context.js';
import { defineTool } from '../../src/server/define-tool.js';

const { toolRegistry, pushMock, replaceMock } = vi.hoisted(() => ({
  toolRegistry: new Map<string, Record<string, unknown>>(),
  pushMock: vi.fn(),
  replaceMock: vi.fn()
}));

let pathnameMock = '/projects';
let searchParamsMock = new URLSearchParams('tab=active&tag=a&tag=b');

vi.mock('@mcp-b/react-webmcp', () => ({
  useWebMCP: (config: Record<string, unknown>) => {
    toolRegistry.set(String(config.name), config);

    return {
      state: {
        isExecuting: false,
        lastResult: null,
        error: null,
        executionCount: 0
      },
      execute: (input: unknown) => (config.handler as (input: unknown) => Promise<unknown>)(input),
      reset: vi.fn()
    };
  }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock
  }),
  usePathname: () => pathnameMock,
  useSearchParams: () => searchParamsMock
}));

const createTaskTool = defineTool({
  name: 'create_task',
  description: 'Create a task',
  inputSchema: z.object({
    title: z.string(),
    priority: z.enum(['low', 'medium', 'high']).default('medium')
  }),
  outputSchema: z.object({
    id: z.string(),
    success: z.boolean()
  })
});

const contextFactory = createToolContext({
  getAuth: () => ({ userId: 'user_42' }),
  createRequestId: () => 'req_integration_1',
  getMetadata: () => ({ source: 'integration-test' })
});

const createTaskAction = createToolAction(
  createTaskTool,
  async ({ title, priority }, context) => ({
    id: `${context.requestId}:${context.auth?.userId}:${title}:${priority}`,
    success: true
  }),
  { getContext: contextFactory }
);

function IntegrationHarness() {
  useServerTool(createTaskTool, createTaskAction);

  useNavigationTool({
    routes: [
      { path: '/projects/[id]', params: z.object({ id: z.string() }) },
      { path: '/settings' }
    ]
  });

  useSearchParamsTool();

  return null;
}

describe('integration flow', () => {
  beforeEach(() => {
    toolRegistry.clear();
    pushMock.mockClear();
    replaceMock.mockClear();
    pathnameMock = '/projects';
    searchParamsMock = new URLSearchParams('tab=active&tag=a&tag=b');
  });

  it('registers tools and executes server action, navigation, and search tool handlers', async () => {
    render(<IntegrationHarness />);

    const createTaskConfig = toolRegistry.get('create_task');
    const navigationConfig = toolRegistry.get('navigate_app_route');
    const searchConfig = toolRegistry.get('get_search_params');

    expect(createTaskConfig).toBeDefined();
    expect(navigationConfig).toBeDefined();
    expect(searchConfig).toBeDefined();

    const taskResult = await (createTaskConfig?.handler as (input: unknown) => Promise<unknown>)({
      title: 'Ship docs',
      priority: 'high'
    });

    expect(taskResult).toEqual({
      id: 'req_integration_1:user_42:Ship docs:high',
      success: true
    });

    const navResult = await (navigationConfig?.handler as (input: unknown) => Promise<unknown>)({
      route: '/projects/[id]',
      params: { id: 'abc-123' }
    });

    expect(pushMock).toHaveBeenCalledWith('/projects/abc-123');
    expect(navResult).toEqual({
      success: true,
      href: '/projects/abc-123'
    });

    const searchResult = await (searchConfig?.handler as (input: unknown) => Promise<unknown>)({});

    expect(searchResult).toEqual({
      pathname: '/projects',
      href: '/projects?tab=active&tag=a&tag=b',
      searchParams: {
        tab: 'active',
        tag: ['a', 'b']
      }
    });
  });
});
