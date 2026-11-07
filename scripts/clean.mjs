import { rmSync } from 'node:fs';

const dir = process.argv[2] || 'dist';
rmSync(new URL(`../${dir}`, import.meta.url), { recursive: true, force: true });
