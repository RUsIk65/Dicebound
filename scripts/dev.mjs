import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const children = [
  spawn(process.execPath, ['server/game.mjs'], { stdio: 'inherit', cwd: process.cwd() }),
  spawn(process.execPath, [resolve('node_modules/vinext/dist/cli.js'), 'dev', '--port', '5173', '--hostname', '127.0.0.1'], { stdio: 'inherit', cwd: process.cwd() }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  setTimeout(() => process.exit(code), 300).unref();
}
for (const child of children) {
  child.on('error', error => { console.error(error); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code || 0); });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
