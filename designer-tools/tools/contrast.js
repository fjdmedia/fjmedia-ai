import { z } from 'zod';

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

function parseColor(color) {
  color = color.trim().toLowerCase();
  if (color.startsWith('#')) return hexToRgb(color);
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (match) return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
  throw new Error(`Unsupported color format: ${color}. Use hex (#fff, #ffffff) or rgb(r, g, b).`);
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function registerCheckContrast(server) {
  server.tool(
    'check_contrast',
    {
      foreground: z.string().describe('Foreground (text) color in hex (#fff or #ffffff) or rgb(r, g, b) format'),
      background: z.string().describe('Background color in hex (#fff or #ffffff) or rgb(r, g, b) format')
    },
    async ({ foreground, background }) => {
      try {
        const fg = parseColor(foreground);
        const bg = parseColor(background);
        const ratio = contrastRatio(fg, bg);
        const rounded = Math.round(ratio * 100) / 100;

        const result = {
          foreground,
          background,
          ratio: rounded,
          ratioString: `${rounded}:1`,
          normalText: {
            AA: rounded >= 4.5 ? 'PASS' : 'FAIL',
            AAA: rounded >= 7 ? 'PASS' : 'FAIL'
          },
          largeText: {
            AA: rounded >= 3 ? 'PASS' : 'FAIL',
            AAA: rounded >= 4.5 ? 'PASS' : 'FAIL'
          }
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${err.message}`
          }],
          isError: true
        };
      }
    }
  );
}
