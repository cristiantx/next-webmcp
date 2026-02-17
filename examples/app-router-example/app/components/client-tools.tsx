'use client';

import { useNavigationTool, useSearchParamsTool, useServerTool } from 'next-webmcp';
import { z } from 'zod';

import { createTaskAction } from '../actions/mcp-tools';
import { createTaskTool } from '../tools/definitions';

export function ClientTools() {
  useServerTool(createTaskTool, createTaskAction);

  useNavigationTool({
    routes: [
      {
        path: '/dashboard/[id]',
        description: 'Navigate to a dashboard by id',
        params: z.object({ id: z.string() })
      },
      {
        path: '/settings',
        description: 'Open account settings'
      }
    ]
  });

  useSearchParamsTool();

  return null;
}
