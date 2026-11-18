// Minimal static server for the tracker. No dependencies.
//
//   node tools/serve.mjs            → serve on 8123 and open the browser
//   node tools/serve.mjs --no-open   → serve only
//   node tools/serve.mjs 9000        → serve on a specific port
//
// The site is opened over http instead of file:// because <markdown> elements
// fetch their .md files, which browsers refuse to do from the filesystem.

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const argv = process.argv.slice(2);
const NO_OPEN = argv.includes('--no-open');
const portArg = argv.find(a => /^\d+$/.test(a));
const START_PORT = portArg ? Number(portArg) : 8123;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, code, text) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

const server = createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return send(res, 400, 'Bad request');
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const target = normalize(join(ROOT, urlPath));
  // Refuse anything that escapes the project folder.
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return send(res, 403, 'Forbidden');

  let stat;
  try {
    stat = statSync(target);
  } catch {
    return send(res, 404, 'Not found: ' + urlPath);
  }
  if (stat.isDirectory()) return send(res, 404, 'Not found: ' + urlPath);

  res.writeHead(200, {
    'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
    'Content-Length': stat.size,
    // Markdown is edited while the server runs, so never cache it.
    'Cache-Control': extname(target).toLowerCase() === '.md' ? 'no-store' : 'no-cache'
  });
  createReadStream(target).pipe(res);
});

function openBrowser(url) {
  const cmd =
    process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] :
    process.platform === 'darwin' ? ['open', [url]] :
    ['xdg-open', [url]];
  try {
    spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref();
  } catch {
    console.log('Open this URL manually: ' + url);
  }
}

function listen(port, attempt = 0) {
  server.once('error', err => {
    if (err.code === 'EADDRINUSE' && attempt < 20) {
      console.log('Port ' + port + ' is busy, trying ' + (port + 1) + '…');
      listen(port + 1, attempt + 1);
      return;
    }
    console.error('Server error: ' + err.message);
    process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    const url = 'http://127.0.0.1:' + port + '/';
    console.log('Serving ' + ROOT);
    console.log('  ' + url);
    console.log('Ctrl+C to stop.');
    if (!NO_OPEN) openBrowser(url);
  });
}

listen(START_PORT);
