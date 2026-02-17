import { withWebMCP } from 'next-webmcp/plugin';

const nextConfig = {
  reactStrictMode: true
};

export default withWebMCP(nextConfig, {
  routes: {
    enabled: true,
    appDir: './app',
    outFile: './.next-webmcp/routes.generated.ts'
  }
});
