'use server';

import { createToolAction, createToolContext } from 'next-webmcp/server';

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

export const createTaskAction = createToolAction(
  createTaskTool,
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
