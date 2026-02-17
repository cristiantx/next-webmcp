import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { useNavigationTool } from '../../src/hooks/use-navigation-tool.js';
import { useSearchParamsTool } from '../../src/hooks/use-search-params-tool.js';

const { useWebMCPMock, pushMock, replaceMock } = vi.hoisted(() => ({
  useWebMCPMock: vi.fn<(config: unknown, deps?: unknown) => unknown>(() => ({
    state: {
      isExecuting: false,
      lastResult: null,
      error: null,
      executionCount: 0
    },
    execute: vi.fn(),
    reset: vi.fn()
  })),
  pushMock: vi.fn(),
  replaceMock: vi.fn()
}));

let pathnameMock = '/dashboard';
let searchParamsMock = new URLSearchParams();

vi.mock('@mcp-b/react-webmcp', () => ({
  useWebMCP: useWebMCPMock
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock
  }),
  usePathname: () => pathnameMock,
  useSearchParams: () => searchParamsMock
}));

function NavigationHarness() {
  useNavigationTool({
    routes: [
      {
        path: '/dashboard/[id]',
        params: z.object({ id: z.string() })
      },
      {
        path: '/settings'
      }
    ]
  });

  return null;
}

function SearchParamsHarness() {
  useSearchParamsTool();
  return null;
}

describe('navigation and search hooks', () => {
  beforeEach(() => {
    useWebMCPMock.mockClear();
    pushMock.mockClear();
    replaceMock.mockClear();
    pathnameMock = '/dashboard';
    searchParamsMock = new URLSearchParams();
  });

  it('interpolates dynamic routes and calls router.push', async () => {
    render(<NavigationHarness />);

    const config = useWebMCPMock.mock.calls.at(-1)?.[0] as unknown as Record<string, unknown>;
    expect(config).toBeDefined();
    const result = await (config as any).handler({
      route: '/dashboard/[id]',
      params: { id: '42' }
    });

    expect(pushMock).toHaveBeenCalledWith('/dashboard/42');
    expect(result).toEqual({ success: true, href: '/dashboard/42' });
  });

  it('exposes current pathname and normalized search params', async () => {
    pathnameMock = '/reports';
    searchParamsMock = new URLSearchParams('filter=active&tag=a&tag=b');

    render(<SearchParamsHarness />);

    const config = useWebMCPMock.mock.calls.at(-1)?.[0] as unknown as Record<string, unknown>;
    expect(config).toBeDefined();
    const result = await (config as any).handler({});

    expect(result).toEqual({
      pathname: '/reports',
      href: '/reports?filter=active&tag=a&tag=b',
      searchParams: {
        filter: 'active',
        tag: ['a', 'b']
      }
    });
  });
});
