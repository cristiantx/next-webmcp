'use client';

import { useWebMCP } from '@mcp-b/react-webmcp';
import { usePathname, useSearchParams } from 'next/navigation';
import { z } from 'zod';

export interface UseSearchParamsToolOptions {
  name?: string;
  description?: string;
}

type SearchParamsShape = Record<string, string | string[]>;

function toSearchParamsObject(searchParams: URLSearchParams): SearchParamsShape {
  const result: SearchParamsShape = {};

  for (const [key, value] of searchParams.entries()) {
    const existing = result[key];

    if (existing === undefined) {
      result[key] = value;
      continue;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      continue;
    }

    result[key] = [existing, value];
  }

  return result;
}

const searchParamsOutputSchema = {
  pathname: z.string(),
  href: z.string(),
  searchParams: z.record(z.union([z.string(), z.array(z.string())]))
};

/**
 * Hook that registers a tool to get current URL pathname and search params.
 * @param options - Configuration options for the tool
 * @returns The WebMCP tool registration result
 */
export function useSearchParamsTool({ name, description }: UseSearchParamsToolOptions = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Memoize search params string to maintain referential equality
  const searchParamsString = searchParams.toString();

  return useWebMCP(
    {
      name: name ?? 'get_search_params',
      description: description ?? 'Return the current URL pathname and query params.',
      inputSchema: {},
      outputSchema: searchParamsOutputSchema,
      handler: async () => {
        const normalizedParams = toSearchParamsObject(new URLSearchParams(searchParamsString));

        return {
          pathname,
          href: searchParamsString ? `${pathname}?${searchParamsString}` : pathname,
          searchParams: normalizedParams
        };
      }
    },
    [pathname, searchParamsString]
  );
}

export { toSearchParamsObject };
