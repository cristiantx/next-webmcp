'use client';

import { useWebMCP } from '@mcp-b/react-webmcp';
import { useRouter } from 'next/navigation';
import { type DependencyList, useMemo } from 'react';
import { z } from 'zod';

import { normalizeToolError } from '../shared/errors.js';

export interface NavigationRoute {
  path: string;
  description?: string;
  params?: z.AnyZodObject;
}

export interface UseNavigationToolOptions {
  routes: NavigationRoute[];
  name?: string;
  description?: string;
  deps?: DependencyList;
}

function interpolateRoutePath(pathTemplate: string, params: Record<string, unknown> = {}): string {
  return pathTemplate.replace(/\[([^\]]+)\]/g, (_match, key: string) => {
    const value = params[key];

    if (value === undefined || value === null) {
      throw new Error(`Missing route parameter "${key}" for "${pathTemplate}".`);
    }

    return encodeURIComponent(String(value));
  });
}

const navigationInputSchema = {
  route: z.string().describe('Route template to navigate to'),
  params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  replace: z.boolean().optional()
};

const navigationOutputSchema = {
  success: z.boolean(),
  href: z.string()
};

/**
 * Hook that registers a navigation tool for App Router navigation.
 * @param options - Configuration options including routes and tool metadata
 * @returns The WebMCP tool registration result
 */
export function useNavigationTool({ routes, name, description, deps }: UseNavigationToolOptions) {
  const router = useRouter();

  // Memoize route help text to avoid recalculation on every render
  const routeHelpText = useMemo(
    () =>
      routes
        .map((route) => `${route.path}${route.description ? ` (${route.description})` : ''}`)
        .join(', '),
    [routes]
  );

  return useWebMCP(
    {
      name: name ?? 'navigate_app_route',
      description:
        description ??
        `Navigate the user to one of the supported routes. Available routes: ${routeHelpText}`,
      inputSchema: navigationInputSchema,
      outputSchema: navigationOutputSchema,
      handler: async ({ route, params, replace }) => {
        const routeConfig = routes.find((item) => item.path === route);

        if (!routeConfig) {
          throw normalizeToolError(
            new Error(`Route "${route}" is not registered in useNavigationTool.`),
            'INVALID_INPUT',
            'Invalid route.'
          );
        }

        if (routeConfig.params) {
          routeConfig.params.parse(params ?? {});
        }

        const href = interpolateRoutePath(route, params);

        if (replace) {
          router.replace(href);
        } else {
          router.push(href);
        }

        return {
          success: true,
          href
        };
      }
    },
    deps
  );
}

export { interpolateRoutePath };
