import {
  WebMCPProviderClient,
  type WebMCPAgentOptions,
  type WebMCPProviderClientProps
} from './webmcp-provider-client.js';

export type WebMCPProviderProps = WebMCPProviderClientProps;
export type { WebMCPAgentOptions };

export function WebMCPProvider(props: WebMCPProviderProps) {
  return <WebMCPProviderClient {...props} />;
}
