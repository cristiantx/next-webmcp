import { z } from 'zod';

export const createTaskTool = {
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
};
