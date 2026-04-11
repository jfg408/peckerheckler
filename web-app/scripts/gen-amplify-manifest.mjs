/**
 * Generates deploy-manifest.json for Amplify WEB_COMPUTE after `next build`.
 * Placed in .next/standalone/ which is the baseDirectory.
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const manifest = {
  version: 1,
  routes: [
    {
      path: '/_next/static/*',
      target: { kind: 'Static', cacheControl: 'public, max-age=31536000, immutable' },
    },
    {
      path: '/public/*',
      target: { kind: 'Static' },
    },
    {
      path: '/*',
      target: { kind: 'Compute', src: 'default' },
    },
  ],
  computeResources: [
    {
      name: 'default',
      enabled: true,
      runtime: 'nodejs18.x',
      entrypoint: 'server.js',
    },
  ],
};

const outPath = join(root, '.next', 'standalone', 'deploy-manifest.json');
writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log('Generated .next/standalone/deploy-manifest.json');
