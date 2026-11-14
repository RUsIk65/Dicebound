import { spawn } from 'node:child_process';
import { createServer, request } from 'node:http';
import { resolve } from 'node:path';

// Keep one browser origin for HttpOnly guest sessions and SSE in the built app.
const children = [
  spawn(process.execPath, ['server/game.mjs'], { stdio: 'inherit' }),
  spawn(process.execPath, [resolve('node_modules/vinext/dist/cli.js'), 'start', '--port', '5174', '--hostname', '127.0.0.1'], { stdio: 'inherit' }),
];
const proxy = createServer((req, res) => {
  const upstream = request({ hostname: '127.0.0.1', port: req.url.startsWith('/api/') ? 3001 : 5174, path: req.url, method: req.method, headers: req.headers }, response => {
    res.writeHead(response.statusCode, response.headers); response.pipe(res);
  });
  upstream.on('error', () => { if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Dicebound запускается. Обновите страницу через несколько секунд.'); });
  res.on('close', () => upstream.destroy());
  req.pipe(upstream);
});
proxy.listen(5173, '127.0.0.1', () => console.log('Dicebound: http://127.0.0.1:5173'));
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true; proxy.close(); for (const child of children) child.kill();
  setTimeout(() => process.exit(code), 300).unref();
}
for (const child of children) { child.on('error', error => { console.error(error); stop(1); }); child.on('exit', code => { if (!stopping) stop(code || 0); }); }
proxy.on('error', error => { console.error(error); stop(1); });
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop());
