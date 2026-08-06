import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageMetadata = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const version = String(packageMetadata.version);
const dist = resolve(root, 'dist');
const releaseRoot = resolve(root, 'release');
const releaseDirectory = resolve(releaseRoot, `ConnectBits-v${version}-unpacked`);

async function filesRecursively(directory) {
  const result = [];
  for (const entry of await readdir(directory)) {
    const absolute = resolve(directory, entry);
    const info = await stat(absolute);
    if (info.isDirectory()) result.push(...(await filesRecursively(absolute)));
    else result.push(absolute);
  }
  return result;
}

await rm(releaseDirectory, { recursive: true, force: true });
await mkdir(releaseRoot, { recursive: true });
await cp(dist, releaseDirectory, { recursive: true });

const requiredFiles = [
  'manifest.json',
  'service-worker.js',
  'content.js',
  'popup.html',
  'options.html',
  'logs.html',
  'reader.html',
  'onboarding.html',
  '_locales/en/messages.json',
  '_locales/ja/messages.json',
];
const releaseFiles = new Set(
  (await filesRecursively(releaseDirectory))
    .map((file) => relative(releaseDirectory, file).replaceAll('\\', '/'))
    .filter((file) => !file.endsWith('.map')),
);
for (const file of await filesRecursively(releaseDirectory)) {
  if (file.endsWith('.map')) await rm(file);
}
const missing = requiredFiles.filter((file) => !releaseFiles.has(file));
if (missing.length > 0) {
  throw new Error(`Release directory is incomplete: ${missing.join(', ')}`);
}

const checksumLines = [];
for (const file of [...releaseFiles].sort()) {
  const bytes = await readFile(resolve(releaseDirectory, file));
  checksumLines.push(`${createHash('sha256').update(bytes).digest('hex')}  ${file}`);
}
await writeFile(resolve(releaseDirectory, 'SHA256SUMS.txt'), `${checksumLines.join('\n')}\n`);
await writeFile(
  resolve(releaseDirectory, 'INSTALL_NOTE.txt'),
  [
    `ConnectBits Public Preview v${version}`,
    '',
    'Load this unpacked directory from chrome://extensions with Developer mode enabled.',
    'After updating the extension, reload pages that were already open.',
    'The first installation opens the local setup and permission review.',
    '',
    'Japanese guide: docs/release/INSTALL.ja.md in the source repository',
    'English guide: docs/release/INSTALL.en.md in the source repository',
  ].join('\n'),
);

console.log(`Prepared: ${releaseDirectory}`);
