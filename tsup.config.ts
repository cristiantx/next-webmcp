import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'server/index': 'src/server/index.ts',
    'plugin/index': 'src/plugin/index.ts'
  },
  format: ['esm'],
  target: 'es2022',
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom', 'next', '@mcp-b/react-webmcp', '@mcp-b/global', 'zod']
});
