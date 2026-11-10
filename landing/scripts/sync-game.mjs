// Builds the game's web bundle (../www) and copies it to public/play so the landing page can embed it.
import { execSync } from 'node:child_process';
import { cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const out = join(here, '..', 'public', 'play');

if (!existsSync(join(root, 'node_modules'))) execSync('npm install', { cwd: root, stdio: 'inherit' });
execSync('npm run build:web', { cwd: root, stdio: 'inherit' });
rmSync(out, { recursive: true, force: true });
cpSync(join(root, 'www'), out, { recursive: true });
console.log('Game copied to public/play');
