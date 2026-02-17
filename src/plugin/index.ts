import path from 'node:path';

import { generateWebMCPRoutes, type GenerateWebMCPRoutesOptions } from './route-generator.js';

export interface WebMCPRoutesPluginOptions {
  enabled?: boolean;
  appDir?: string;
  outFile?: string;
  basePath?: string;
}

export interface WebMCPPluginOptions {
  routes?: WebMCPRoutesPluginOptions;
}

type WebpackFn = (config: unknown, context: unknown) => unknown;

interface NextConfigLike {
  webpack?: WebpackFn;
  [key: string]: unknown;
}

function resolveRouteOptions(options: WebMCPRoutesPluginOptions = {}): GenerateWebMCPRoutesOptions {
  const resolvedOptions: GenerateWebMCPRoutesOptions = {
    appDir: path.resolve(options.appDir ?? path.join(process.cwd(), 'app')),
    outFile: path.resolve(options.outFile ?? path.join(process.cwd(), '.next-webmcp', 'routes.generated.ts'))
  };

  if (options.basePath !== undefined) {
    resolvedOptions.basePath = options.basePath;
  }

  return resolvedOptions;
}

export function withWebMCP(nextConfig: NextConfigLike = {}, options: WebMCPPluginOptions = {}): NextConfigLike {
  const routeOptions = options.routes;

  if (routeOptions?.enabled) {
    generateWebMCPRoutes(resolveRouteOptions(routeOptions));
  }

  const originalWebpack = nextConfig.webpack;

  return {
    ...nextConfig,
    webpack(config: unknown, context: unknown) {
      if (routeOptions?.enabled) {
        generateWebMCPRoutes(resolveRouteOptions(routeOptions));
      }

      if (typeof originalWebpack === 'function') {
        return originalWebpack(config, context);
      }

      return config;
    }
  };
}

export { generateWebMCPRoutes };
export type { GenerateWebMCPRoutesOptions, GeneratedRoute } from './route-generator.js';
