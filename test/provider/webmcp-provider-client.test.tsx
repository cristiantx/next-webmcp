import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WebMCPProviderClient } from '../../src/provider/webmcp-provider-client.js';

function TestAgent() {
  return <div data-testid="webmcp-agent" />;
}

describe('WebMCPProviderClient', () => {
  beforeEach(() => {
    delete (window as Window & { __nextWebMcpProviderState?: unknown }).__nextWebMcpProviderState;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('deduplicates the agent in nested providers', async () => {
    render(
      <WebMCPProviderClient appId="parent" injectPolyfill={false} agent={{ component: TestAgent }}>
        <WebMCPProviderClient appId="child" injectPolyfill={false} agent={{ component: TestAgent }}>
          <div data-testid="content" />
        </WebMCPProviderClient>
      </WebMCPProviderClient>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('webmcp-agent')).toHaveLength(1);
    });
  });

  it('warns and suppresses additional top-level providers', async () => {
    const warningSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(
      <WebMCPProviderClient appId="first" injectPolyfill={false} agent={{ component: TestAgent }}>
        <div />
      </WebMCPProviderClient>
    );

    render(
      <WebMCPProviderClient appId="second" injectPolyfill={false} agent={{ component: TestAgent }}>
        <div />
      </WebMCPProviderClient>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('webmcp-agent')).toHaveLength(1);
    });

    expect(warningSpy).toHaveBeenCalledTimes(1);
    expect(warningSpy.mock.calls[0]?.[0]).toContain('Duplicate top-level WebMCPProvider');
  });
});
