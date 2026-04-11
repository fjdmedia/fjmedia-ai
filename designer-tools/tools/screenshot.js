import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

export function registerScreenshot(server) {
  server.tool(
    'screenshot',
    {
      url: z.string().describe('URL to screenshot (http/https or localhost from serve_local)'),
      outputDir: z.string().optional().describe('Directory to save screenshots. Defaults to current working directory.'),
      viewports: z.string().optional().describe('Comma-separated viewport widths. Defaults to "1440,768,375"')
    },
    async ({ url, outputDir, viewports }) => {
      const widths = (viewports || '1440,768,375').split(',').map(w => parseInt(w.trim()));
      const dir = outputDir || process.cwd();
      const label = new URL(url).hostname.replace(/[^a-z0-9]/gi, '-');
      const timestamp = Date.now();

      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      let browser;
      try {
        browser = await puppeteer.launch({ headless: true });
        const results = [];

        for (const width of widths) {
          const page = await browser.newPage();
          await page.setViewport({ width, height: 900 });
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

          // Wait a bit for animations/lazy-loaded content
          await new Promise(r => setTimeout(r, 1500));

          const filename = `${label}-${width}w-${timestamp}.png`;
          const filepath = path.join(dir, filename);
          await page.screenshot({ path: filepath, fullPage: true });
          await page.close();

          results.push({ width, filename, filepath });
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              url,
              screenshots: results,
              outputDir: dir
            }, null, 2)
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: `Error capturing screenshots: ${err.message}`
          }],
          isError: true
        };
      } finally {
        if (browser) await browser.close();
      }
    }
  );
}
