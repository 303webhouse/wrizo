import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Wait for Vite to start
setTimeout(() => {
  // Compile main.ts and preload.ts - suppress errors and warnings, just compile
  const tsc = spawn('pnpm', ['exec', 'tsc', 'src/main.ts', 'src/preload.ts', '--outDir', 'dist', '--declaration', 'false', '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck', '--esModuleInterop', '--moduleResolution', 'node'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
  });

  tsc.stderr?.on('data', (data) => {
    // Suppress type errors, just let it compile
  });

  tsc.on('exit', () => {
    // Start Electron using the Electron binary (not node)
    const electron = spawn('pnpm', ['exec', 'electron', '.'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    });
  });
}, 3000);
