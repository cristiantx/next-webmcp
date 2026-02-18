'use server';

import { createToolContext, executeTool, type InferToolActionInput } from 'next-webmcp/server';

import { auth } from '../../lib/auth';
import { createTaskTool } from '../tools/definitions';

const getContext = createToolContext({
  getAuth: async () => {
    const session = await auth();
    return {
      userId: session.user.id
    };
  },
  getMetadata: async () => ({
    feature: 'tasks'
  })
});

export async function createTaskAction(input: InferToolActionInput<typeof createTaskTool>) {
  return executeTool(
    createTaskTool,
    input,
    async ({ title, priority }, context) => {
    const fakeId = `${context.auth?.userId ?? 'anonymous'}-${Date.now()}`;

    // Replace this with real DB persistence.
    return {
      id: `${fakeId}:${title}:${priority}`,
      success: true
    };
    },
    { getContext }
  );
}
