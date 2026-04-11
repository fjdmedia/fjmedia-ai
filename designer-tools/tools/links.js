import puppeteer from 'puppeteer';
import { z } from 'zod';

export function registerCheckLinks(server) {
  server.tool(
    'check_links',
    { url: z.string().describe('URL of the page to check links on') },
    async ({ url }) => {
      let browser;
      try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Extract all links
        const links = await page.evaluate(() => {
          return [...document.querySelectorAll('a[href]')]
            .map(a => ({ href: a.href, text: a.textContent.trim().slice(0, 50) }))
            .filter(l => l.href.startsWith('http'));
        });

        await page.close();

        // Check each link
        const results = [];
        const checked = new Set();

        for (const link of links) {
          if (checked.has(link.href)) continue;
          checked.add(link.href);

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(link.href, {
              method: 'HEAD',
              signal: controller.signal,
              redirect: 'follow'
            });

            clearTimeout(timeoutId);
            results.push({
              url: link.href,
              text: link.text,
              status: res.status,
              ok: res.ok
            });
          } catch (err) {
            results.push({
              url: link.href,
              text: link.text,
              status: 'TIMEOUT/ERROR',
              ok: false,
              error: err.message
            });
          }
        }

        const broken = results.filter(r => !r.ok);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              pageUrl: url,
              totalLinks: results.length,
              brokenCount: broken.length,
              broken: broken,
              all: results
            }, null, 2)
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: `Error checking links: ${err.message}`
          }],
          isError: true
        };
      } finally {
        if (browser) await browser.close();
      }
    }
  );
}
