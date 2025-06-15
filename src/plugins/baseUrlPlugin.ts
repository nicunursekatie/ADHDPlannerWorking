// baseUrlPlugin.ts
import type { Plugin } from 'vite';

export function baseUrlPlugin(): Plugin {
  return {
    name: 'baseUrlPlugin',
    transformIndexHtml(html, { server }) {
      const base = process.env.GITHUB_PAGES === 'true' ? '/ADHDPlannerWorking/' : '/';
      return html.replace(/<%= BASE_URL %>/g, base);
    }
  };
}