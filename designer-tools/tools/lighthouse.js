import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
import { z } from 'zod';

export function registerLighthouse(server) {
  server.tool(
    'lighthouse_audit',
    { url: z.string().describe('URL to audit (http/https or localhost from serve_local)') },
    async ({ url }) => {
      let browser;
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-gpu']
        });

        const result = await lighthouse(url, {
          port: new URL(browser.wsEndpoint()).port,
          output: 'json',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
        });

        const report = result.lhr;
        const categories = {};

        for (const [key, cat] of Object.entries(report.categories)) {
          const audits = cat.auditRefs
            .map(ref => report.audits[ref.id])
            .filter(a => a && a.score !== null && a.score < 1)
            .sort((a, b) => (a.score || 0) - (b.score || 0))
            .slice(0, 5)
            .map(a => ({
              id: a.id,
              title: a.title,
              score: Math.round((a.score || 0) * 100),
              description: a.description?.split('[')[0]?.trim() || ''
            }));

          categories[key] = {
            score: Math.round((cat.score || 0) * 100),
            topIssues: audits
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              url,
              scores: {
                performance: categories.performance?.score,
                accessibility: categories.accessibility?.score,
                bestPractices: categories['best-practices']?.score,
                seo: categories.seo?.score
              },
              details: categories
            }, null, 2)
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: `Error running Lighthouse: ${err.message}`
          }],
          isError: true
        };
      } finally {
        if (browser) await browser.close();
      }
    }
  );
}
