import { cpSync, copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
copyFileSync('manifest.json', 'dist/manifest.json');
copyFileSync('sidepanel.html', 'dist/sidepanel.html');
cpSync('icons', 'dist/icons', { recursive: true });
