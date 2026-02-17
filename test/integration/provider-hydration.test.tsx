import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { WebMCPProvider } from '../../src/provider/webmcp-provider.js';

describe('WebMCPProvider hydration', () => {
  it('hydrates without mismatch warnings', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const serverHtml = renderToString(
      <WebMCPProvider appId="hydration-test" injectPolyfill={false}>
        <div data-testid="hydration-content">Hydration Safe</div>
      </WebMCPProvider>
    );

    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    let root: ReturnType<typeof hydrateRoot> | undefined;

    await act(async () => {
      root = hydrateRoot(
        container,
        <WebMCPProvider appId="hydration-test" injectPolyfill={false}>
          <div data-testid="hydration-content">Hydration Safe</div>
        </WebMCPProvider>
      );
    });

    expect(container.textContent).toContain('Hydration Safe');
    expect(
      consoleErrorSpy.mock.calls.some((call) => String(call[0]).toLowerCase().includes('hydration'))
    ).toBe(false);

    root?.unmount();
    consoleErrorSpy.mockRestore();
    container.remove();
  });
});
