import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { withWebMCP } from '../../src/plugin/index.js';
import { generateWebMCPRoutes } from '../../src/plugin/route-generator.js';

const fixtureAppDir = path.resolve('test/plugin/fixtures/app');

describe('route generator', () => {
  it('derives stable route definitions and tool names from app pages', () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'next-webmcp-routes-'));
    const outFile = path.join(tempDir, 'routes.generated.ts');

    const routes = generateWebMCPRoutes({
      appDir: fixtureAppDir,
      outFile
    });

    expect(routes).toEqual([
      {
        path: '/',
        toolName: 'navigate_to_home'
      },
      {
        path: '/dashboard/[id]',
        toolName: 'navigate_to_dashboard_id'
      },
      {
        path: '/dashboard/settings',
        toolName: 'navigate_to_dashboard_settings'
      }
    ]);

    const generatedContent = readFileSync(outFile, 'utf8');
    expect(generatedContent).toContain('navigate_to_dashboard_id');
    expect(generatedContent).toContain('generatedNavigationRoutes');
  });

  it('applies basePath and hooks into withWebMCP', () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'next-webmcp-plugin-'));
    const outFile = path.join(tempDir, 'routes.generated.ts');

    const config = withWebMCP(
      {
        reactStrictMode: true
      },
      {
        routes: {
          enabled: true,
          appDir: fixtureAppDir,
          outFile,
          basePath: '/app'
        }
      }
    );

    expect(typeof config.webpack).toBe('function');

    // Routes are generated during webpack compilation, not at config load time
    expect(existsSync(outFile)).toBe(false);

    const nextConfigResult = config.webpack?.({ mode: 'development' }, {});
    expect(nextConfigResult).toEqual({ mode: 'development' });

    expect(existsSync(outFile)).toBe(true);

    const generatedContent = readFileSync(outFile, 'utf8');
    expect(generatedContent).toContain('/app/dashboard/[id]');
  });
});
