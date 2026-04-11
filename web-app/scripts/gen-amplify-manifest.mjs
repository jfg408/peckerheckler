/**
 * Generates .amplify-hosting/deploy-manifest.json after `next build`.
 * Amplify WEB_COMPUTE requires this file but doesn't generate it when
 * a custom amplify.yml build command is used.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const routesManifest = JSON.parse(
  readFileSync(join(root, '.next', 'routes-manifest.json'), 'utf8')
);

const staticRoutes = (routesManifest.staticRoutes ?? []).map((r) => ({
  path: r.page,
  target: { kind: 'Static' },
  fallback: null,
}));

const routes = [
  // Next.js static assets
  { path: '/_next/static/*', target: { kind: 'Static' }, fallback: null },
  // Public folder
  { path: '/public/*', target: { kind: 'Static' }, fallback: null },
  // All other routes → compute
  { path: '/*', target: { kind: 'Compute', src: 'default' }, fallback: null },
];

const manifest = {
  version: 1,
  routes,
  computeResources: [{ name: 'default', enabled: true }],
  framework: { name: 'Next.js', version: '14' },
};

// Write to .next/ (the baseDirectory Amplify checks first)
const nextDir = join(root, '.next');
writeFileSync(join(nextDir, 'deploy-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Generated .next/deploy-manifest.json');
