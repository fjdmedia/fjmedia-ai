import puppeteer from 'puppeteer';
import { z } from 'zod';

export function registerAnalyzeImages(server) {
  server.tool(
    'analyze_images',
    { url: z.string().describe('URL of the page to analyze images on (use serve_local for local files)') },
    async ({ url }) => {
      let browser;
      try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Track image network requests for file sizes
        const imageRequests = new Map();
        page.on('response', async (response) => {
          const reqUrl = response.url();
          const contentType = response.headers()['content-type'] || '';
          if (contentType.startsWith('image/')) {
            try {
              const buffer = await response.buffer();
              imageRequests.set(reqUrl, {
                size: buffer.length,
                contentType
              });
            } catch (e) {
              // Response body may be unavailable for some redirects
            }
          }
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Extract image data from DOM
        const images = await page.evaluate(() => {
          return [...document.querySelectorAll('img')].map(img => ({
            src: img.src,
            alt: img.alt,
            hasAlt: img.hasAttribute('alt') && img.alt.length > 0,
            hasLazy: img.loading === 'lazy',
            hasWidth: img.hasAttribute('width'),
            hasHeight: img.hasAttribute('height'),
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            displayWidth: img.clientWidth,
            displayHeight: img.clientHeight
          }));
        });

        await page.close();

        // Merge network data with DOM data
        const results = images.map(img => {
          const network = imageRequests.get(img.src) || {};
          const ext = img.src.split('?')[0].split('.').pop()?.toLowerCase() || 'unknown';
          return {
            src: img.src.length > 100 ? img.src.slice(0, 100) + '...' : img.src,
            format: ext,
            fileSize: network.size ? `${Math.round(network.size / 1024)}KB` : 'unknown',
            fileSizeBytes: network.size || null,
            dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
            displaySize: `${img.displayWidth}x${img.displayHeight}`,
            oversized: img.naturalWidth > img.displayWidth * 2,
            hasAlt: img.hasAlt,
            altText: img.alt || '(empty)',
            hasLazy: img.hasLazy,
            hasWidthHeight: img.hasWidth && img.hasHeight
          };
        });

        const issues = [];
        results.forEach(img => {
          if (!img.hasAlt) issues.push(`Missing alt text: ${img.src}`);
          if (!img.hasLazy) issues.push(`Missing lazy loading: ${img.src}`);
          if (!img.hasWidthHeight) issues.push(`Missing width/height attributes: ${img.src}`);
          if (img.oversized) issues.push(`Oversized (${img.dimensions} displayed at ${img.displaySize}): ${img.src}`);
          if (img.fileSizeBytes && img.fileSizeBytes > 500000) issues.push(`Large file (${img.fileSize}): ${img.src}`);
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              pageUrl: url,
              totalImages: results.length,
              issueCount: issues.length,
              issues,
              images: results
            }, null, 2)
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: `Error analyzing images: ${err.message}`
          }],
          isError: true
        };
      } finally {
        if (browser) await browser.close();
      }
    }
  );
}
