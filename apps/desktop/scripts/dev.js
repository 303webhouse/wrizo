import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Wait for Vite to start
setTimeout(() => {
  // Compile main.ts
  const tsc = spawn('tsc', ['src/main.ts', '--outDir', 'dist', '--declaration', 'false', '--module', 'esnext', '--target', 'es2020', '--skipLibCheck', 'true'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
  });

  tsc.on('exit', () => {
    // Start Electron
    spawn('electron', ['.'], {
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
