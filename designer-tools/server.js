import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerServeLocal, shutdownAllServers } from './tools/serve-local.js';
import { registerLighthouse } from './tools/lighthouse.js';
import { registerScreenshot } from './tools/screenshot.js';
import { registerCheckContrast } from './tools/contrast.js';
import { registerCheckLinks } from './tools/links.js';
import { registerAnalyzeImages } from './tools/images.js';

const server = new McpServer({
  name: 'designer-tools',
  version: '1.0.0'
});

// Register all tools
registerServeLocal(server);
registerLighthouse(server);
registerScreenshot(server);
registerCheckContrast(server);
registerCheckLinks(server);
registerAnalyzeImages(server);

// Graceful shutdown
process.on('SIGINT', () => {
  shutdownAllServers();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdownAllServers();
  process.exit(0);
});

// Start MCP server on stdio
const transport = new StdioServerTransport();
await server.connect(transport);
