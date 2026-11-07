// The Capacitor web bundle: same page as the extension, minus the extension-only files.
import { cpSync, copyFileSync, rmSync } from 'node:fs';

copyFileSync('sidepanel.html', 'www/index.html');
rmSync('www/background.js', { force: true });
cpSync('icons', 'www/icons', { recursive: true });
cpSync('fonts', 'www/fonts', { recursive: true });
