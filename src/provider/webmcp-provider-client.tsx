'use client';

import dynamic from 'next/dynamic';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode
} from 'react';

const PROVIDER_STATE_KEY = '__nextWebMcpProviderState';
const ProviderNestingContext = createContext(false);
ProviderNestingContext.displayName = 'WebMCPProviderNesting';

interface ProviderGlobalState {
  providerCount: number;
  ownerId: string | null;
}

interface RuntimeAgentProps {
  appId: string;
  [key: string]: unknown;
}

export interface WebMCPAgentOptions {
  enabled?: boolean;
  component?: ComponentType<RuntimeAgentProps>;
  loader?: () => Promise<{ default: ComponentType<RuntimeAgentProps> }>;
  props?: Record<string, unknown>;
}

export interface WebMCPProviderClientProps {
  appId: string;
  children: ReactNode;
  agent?: false | WebMCPAgentOptions;
  injectPolyfill?: boolean;
  onPolyfillError?: (error: unknown) => void;
}

declare global {
  interface Window {
    [PROVIDER_STATE_KEY]?: ProviderGlobalState;
  }
}

function getGlobalState(): ProviderGlobalState {
  if (typeof window === 'undefined') {
    return { providerCount: 0, ownerId: null };
  }

  if (!window[PROVIDER_STATE_KEY]) {
    window[PROVIDER_STATE_KEY] = { providerCount: 0, ownerId: null };
  }

  return window[PROVIDER_STATE_KEY];
}

export function WebMCPProviderClient({
  appId,
  children,
  agent,
  injectPolyfill = true,
  onPolyfillError
}: WebMCPProviderClientProps): ReactNode {
  const parentProviderExists = useContext(ProviderNestingContext);
  const [isPrimaryProvider, setIsPrimaryProvider] = useState(false);
  const providerInstanceIdRef = useRef(`provider-${Math.random().toString(36).slice(2)}`);
  const shouldRenderAgent = agent !== false && (agent?.enabled ?? true);

  const agentComponent = agent !== false ? agent?.component : undefined;
  const agentLoader = agent !== false ? agent?.loader : undefined;

  const AgentComponent = useMemo(() => {
    if (agent === false) {
      return null;
    }

    if (agentComponent) {
      return agentComponent;
    }

    if (agentLoader) {
      return dynamic(agentLoader, { ssr: false });
    }

    return null;
  }, [agent === false, agentComponent, agentLoader]);

  useEffect(() => {
    const globalState = getGlobalState();
    const instanceId = providerInstanceIdRef.current;
    globalState.providerCount += 1;

    // Claim ownership atomically: only one provider can own at a time.
    // compareAndSet pattern prevents race in React Strict Mode double-mount.
    if (!parentProviderExists && globalState.ownerId === null) {
      globalState.ownerId = instanceId;
      setIsPrimaryProvider(true);
    } else {
      setIsPrimaryProvider(false);

      if (!parentProviderExists && process.env.NODE_ENV !== 'production') {
        console.warn(
          '[next-webmcp] Duplicate top-level WebMCPProvider detected. Skipping extra polyfill and agent mount.'
        );
      }
    }

    return () => {
      globalState.providerCount = Math.max(0, globalState.providerCount - 1);

      if (globalState.ownerId === instanceId) {
        globalState.ownerId = null;
      }
    };
  }, [parentProviderExists]);

  useEffect(() => {
    if (!isPrimaryProvider || !injectPolyfill) {
      return;
    }

    if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
      return;
    }

    void import('@mcp-b/global').catch((error: unknown) => {
      if (onPolyfillError) {
        onPolyfillError(error);
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.warn('[next-webmcp] Failed to load @mcp-b/global polyfill.', error);
      }
    });
  }, [injectPolyfill, isPrimaryProvider, onPolyfillError]);

  return (
    <ProviderNestingContext.Provider value>
      {children}
      {isPrimaryProvider && shouldRenderAgent && AgentComponent ? (
        <AgentComponent appId={appId} {...(agent?.props ?? {})} />
      ) : null}
    </ProviderNestingContext.Provider>
  );
}
