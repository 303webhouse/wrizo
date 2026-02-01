import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Wait for Vite to start
setTimeout(() => {
  // Compile main.ts - suppress errors and warnings, just compile
  const tsc = spawn('tsc', ['src/main.ts', '--outDir', 'dist', '--declaration', 'false', '--module', 'esnext', '--target', 'es2020', '--skipLibCheck', 'true', '--noEmit', 'false', '--esModuleInterop', 'true', '--noImplicitAny', 'false'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
  });

  tsc.stderr?.on('data', (data) => {
    // Suppress type errors, just let it compile
  });

  tsc.on('exit', () => {
    // Start Electron
    const electron = spawn('electron', ['.'], {
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
