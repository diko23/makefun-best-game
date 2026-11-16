// Lightweight development server for THE MAZEJANITOR
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDir = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const portArgIndex = process.argv.indexOf('--port');
const specifiedPort = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : 8080;
const port = Number.isInteger(specifiedPort) && specifiedPort > 0 && specifiedPort < 65536 ? specifiedPort : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const reqUrl = new URL(req.url ?? '/', 'http://localhost');
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(reqUrl.pathname);
  } catch {
    res.writeHead(400).end('Bad Request');
    return;
  }

  if (decodedPath.endsWith('/')) {
    decodedPath += 'index.html';
  }

  const filePath = resolve(join(gameDir, normalize(decodedPath)));
  if (filePath !== gameDir && !filePath.startsWith(gameDir + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let fileSize = 0;
  try {
    const fileStat = statSync(filePath);
    if (!fileStat.isFile()) {
      res.writeHead(404).end('Not Found');
      return;
    }
    fileSize = fileStat.size;
  } catch {
    res.writeHead(404).end('Not Found');
    return;
  }

  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, {
    'content-type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
    'content-length': fileSize,
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving game/ at http://localhost:${port}`);
});
