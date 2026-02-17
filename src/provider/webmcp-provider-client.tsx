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

  const AgentComponent = useMemo(() => {
    if (agent === false) {
      return null;
    }

    if (agent?.component) {
      return agent.component;
    }

    if (agent?.loader) {
      return dynamic(agent.loader, { ssr: false });
    }

    return null;
  }, [agent]);

  useEffect(() => {
    const globalState = getGlobalState();
    globalState.providerCount += 1;

    const isTopLevelOwner = !parentProviderExists && globalState.ownerId === null;

    if (isTopLevelOwner) {
      globalState.ownerId = providerInstanceIdRef.current;
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
      const cleanupState = getGlobalState();
      cleanupState.providerCount = Math.max(0, cleanupState.providerCount - 1);

      if (cleanupState.ownerId === providerInstanceIdRef.current) {
        cleanupState.ownerId = null;
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
