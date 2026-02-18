import { z } from 'zod';
import { defineTool } from 'next-webmcp/server';

export const createTaskTool = defineTool({
  name: 'create_task',
  description: 'Create a task in a persistent store',
  inputSchema: z.object({
    title: z.string().min(1),
    priority: z.enum(['low', 'medium', 'high']).default('medium')
  }),
  outputSchema: z.object({
    id: z.string(),
    success: z.boolean()
  })
});
