import { render } from '@testing-library/react';
import { z } from 'zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defineTool } from '../../src/server/define-tool.js';
import { useServerTool } from '../../src/hooks/use-server-tool.js';

const { useWebMCPMock } = vi.hoisted(() => ({
  useWebMCPMock: vi.fn<(config: unknown, deps?: unknown) => unknown>(() => ({
    state: {
      isExecuting: false,
      lastResult: null,
      error: null,
      executionCount: 0
    },
    execute: vi.fn(),
    reset: vi.fn()
  }))
}));

vi.mock('@mcp-b/react-webmcp', () => ({
  useWebMCP: useWebMCPMock
}));

function HookHarness({
  tool,
  action,
  onError,
  enabled = true
}: {
  tool: ReturnType<typeof defineTool>;
  action: any;
  onError?: (error: unknown) => void;
  enabled?: boolean;
}) {
  useServerTool(tool, action, {
    enabled,
    onError: (error) => {
      onError?.(error);
    }
  });
  return null;
}

describe('useServerTool', () => {
  beforeEach(() => {
    useWebMCPMock.mockClear();
  });

  it('registers a server action-backed tool and forwards execution', async () => {
    const createTaskTool = defineTool({
      name: 'create_task',
      inputSchema: z.object({ title: z.string() }),
      outputSchema: z.object({ ok: z.boolean() })
    });

    const action = vi.fn(async ({ title }: { title: string }) => ({ ok: title.length > 0 }));

    render(<HookHarness tool={createTaskTool} action={action} />);

    const config = useWebMCPMock.mock.calls.at(-1)?.[0] as unknown as Record<string, unknown>;
    expect(config).toBeDefined();
    const result = await (config as any).handler({ title: 'Ship v1' });

    expect((config as any).name).toBe('create_task');
    expect((config as any).inputSchema.title).toBeDefined();
    expect(action).toHaveBeenCalledWith({ title: 'Ship v1' });
    expect(result).toEqual({ ok: true });
  });

  it('normalizes action errors', async () => {
    const failingTool = defineTool({
      name: 'failing_tool',
      inputSchema: z.object({ id: z.string() })
    });

    const action = vi.fn(async () => {
      throw new Error('server exploded');
    });

    const onError = vi.fn();

    render(<HookHarness tool={failingTool} action={action} onError={onError} />);

    const config = useWebMCPMock.mock.calls.at(-1)?.[0] as unknown as Record<string, unknown>;
    expect(config).toBeDefined();

    await expect((config as any).handler({ id: '1' })).rejects.toMatchObject({
      code: 'HANDLER_ERROR',
      message: 'server exploded'
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'HANDLER_ERROR'
      })
    );
  });
});
