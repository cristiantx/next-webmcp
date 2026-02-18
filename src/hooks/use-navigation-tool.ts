'use client';

import { useWebMCP } from '@mcp-b/react-webmcp';
import { useRouter } from 'next/navigation';
import { type DependencyList, useCallback, useMemo, useRef } from 'react';
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

  const routeHelpText = useMemo(
    () =>
      routes
        .map((route) => `${route.path}${route.description ? ` (${route.description})` : ''}`)
        .join(', '),
    [routes]
  );

  const routesRef = useRef(routes);
  routesRef.current = routes;

  const routerRef = useRef(router);
  routerRef.current = router;

  const handler = useCallback(
    async (input: { route: string; params?: Record<string, string | number | boolean> | undefined; replace?: boolean | undefined }) => {
      const { route, params, replace } = input;
      const currentRoutes = routesRef.current;
      const currentRouter = routerRef.current;

      const routeConfig = currentRoutes.find((item: NavigationRoute) => item.path === route);

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
        currentRouter.replace(href);
      } else {
        currentRouter.push(href);
      }

      return {
        success: true,
        href
      };
    },
    []
  );

  return useWebMCP(
    {
      name: name ?? 'navigate_app_route',
      description:
        description ??
        `Navigate the user to one of the supported routes. Available routes: ${routeHelpText}`,
      inputSchema: navigationInputSchema,
      outputSchema: navigationOutputSchema,
      handler
    },
    deps
  );
}

export { interpolateRoutePath };
