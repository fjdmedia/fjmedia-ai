import express from 'express';
import path from 'path';
import { z } from 'zod';

const activeServers = new Map();

export function registerServeLocal(server) {
  server.tool(
    'serve_local',
    { filePath: z.string().describe('Absolute path to the local HTML file to serve') },
    async ({ filePath }) => {
      const dir = path.dirname(filePath.replace(/\\/g, '/'));
      const filename = path.basename(filePath);

      // Reuse existing server for same directory
      if (activeServers.has(dir)) {
        const existing = activeServers.get(dir);
        clearTimeout(existing.timeout);
        existing.timeout = setTimeout(() => {
          existing.httpServer.close();
          activeServers.delete(dir);
        }, 5 * 60 * 1000);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              url: `http://localhost:${existing.port}/${filename}`,
              port: existing.port,
              directory: dir,
              reused: true
            })
          }]
        };
      }

      const app = express();
      app.use(express.static(dir));

      return new Promise((resolve, reject) => {
        const httpServer = app.listen(0, () => {
          const port = httpServer.address().port;
          const timeout = setTimeout(() => {
            httpServer.close();
            activeServers.delete(dir);
          }, 5 * 60 * 1000);

          activeServers.set(dir, { httpServer, port, timeout });

          resolve({
            content: [{
              type: 'text',
              text: JSON.stringify({
                url: `http://localhost:${port}/${filename}`,
                port: port,
                directory: dir,
                reused: false,
                note: 'Server will auto-shutdown in 5 minutes. Call serve_local again to extend.'
              })
            }]
          });
        });

        httpServer.on('error', (err) => {
          reject(new Error(`Failed to start server: ${err.message}`));
        });
      });
    }
  );
}

export function shutdownAllServers() {
  for (const [dir, entry] of activeServers) {
    clearTimeout(entry.timeout);
    entry.httpServer.close();
    activeServers.delete(dir);
  }
}
