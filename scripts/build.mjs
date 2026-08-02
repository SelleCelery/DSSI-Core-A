import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await build({
  entryPoints: {
    'service-worker': resolve(root, 'src/background/service-worker.ts'),
    content: resolve(root, 'src/content/bootstrap.ts'),
    popup: resolve(root, 'src/popup/popup.ts'),
    options: resolve(root, 'src/options/options.ts'),
    logs: resolve(root, 'src/logs/logs.ts'),
    reader: resolve(root, 'src/reader/reader.ts'),
    onboarding: resolve(root, 'src/onboarding/onboarding.ts'),
  },
  outdir: dist,
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  sourcemap: true,
  minify: false,
  logLevel: 'info',
});

const copyTargets = [
  ['src/manifest/manifest.json', 'manifest.json'],
  ['src/popup/popup.html', 'popup.html'],
  ['src/options/options.html', 'options.html'],
  ['src/logs/logs.html', 'logs.html'],
  ['src/reader/reader.html', 'reader.html'],
  ['src/onboarding/onboarding.html', 'onboarding.html'],
  ['src/ui/base.css', 'base.css'],
];

for (const [source, target] of copyTargets) {
  await cp(resolve(root, source), resolve(dist, target));
}

await cp(resolve(root, 'assets/icons'), resolve(dist, 'icons'), { recursive: true });
await cp(resolve(root, 'src/_locales'), resolve(dist, '_locales'), { recursive: true });

const manifestPath = resolve(dist, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const packageMetadata = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
manifest.version = packageMetadata.version;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
