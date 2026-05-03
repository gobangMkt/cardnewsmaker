const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const crypto = require('crypto');

const app = express();
const PORT = 3017;
const CORE = path.resolve(__dirname, '../core');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(CORE, 'output');
const IMAGE_DIR = path.join(__dirname, 'image');
fs.mkdirSync(IMAGE_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: IMAGE_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(OUTPUT_DIR));

app.post('/api/prepare', upload.array('images', 10), (req, res) => {
  const url = (req.body.url || '').trim();
  if (!url) return res.status(400).json({ error: 'URL 필요' });

  const slug = (url.match(/contents\/(\d+)/) || [])[1] || 'unknown';
  const images = (req.files || []).map((f) => f.filename);

  const imageList = images.length
    ? `\n첨부 이미지(프로젝트 루트 기준): ${images.join(', ')}`
    : '';
  const prompt = `${url} 카드뉴스 만들어.${imageList}`;

  res.json({ slug, url, images, prompt });
});

app.post('/api/generate', upload.array('images', 10), (req, res) => {
  const url = (req.body.url || '').trim();
  if (!url) return res.status(400).json({ error: 'URL 필요' });

  const images = (req.files || []).map((f) => `image/${f.filename}`);
  const imageList = images.length
    ? `\n첨부 이미지(runner/image/ 기준 경로): ${images.join(', ')}`
    : '';
  const prompt = `${url} 카드뉴스 만들어. 완료 후 자동으로 node core/extract.js 까지 실행해줘.${imageList}`;

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');

  const isWin = process.platform === 'win32';
  const spawnCmd = isWin ? 'cmd.exe' : 'claude';
  const spawnArgs = isWin
    ? ['/d', '/c', 'claude', '-p', prompt, '--dangerously-skip-permissions']
    : ['-p', prompt, '--dangerously-skip-permissions'];
  const proc = spawn(spawnCmd, spawnArgs, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });

  const send = (event, data) =>
    res.write(JSON.stringify({ event, ...data }) + '\n');

  send('start', { ts: Date.now() });

  let buf = '';
  const onData = (chunk) => {
    buf += chunk.toString();
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.trim()) send('log', { line });
    }
  };
  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);

  proc.on('error', (err) => {
    send('error', { message: err.message });
    res.end();
  });
  proc.on('close', (code, signal) => {
    if (buf.trim()) send('log', { line: buf });
    send('done', { code, signal });
    res.end();
  });
});

app.get('/api/outputs', (_req, res) => {
  if (!fs.existsSync(OUTPUT_DIR)) return res.json([]);
  const dirs = fs
    .readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const slug = d.name;
      const pngDir = path.join(OUTPUT_DIR, slug, 'png');
      const slidesDir = path.join(OUTPUT_DIR, slug, 'slides');
      const pngs = fs.existsSync(pngDir)
        ? fs.readdirSync(pngDir).filter((f) => f.endsWith('.png')).sort()
        : [];
      const slides = fs.existsSync(slidesDir)
        ? fs.readdirSync(slidesDir).filter((f) => f.endsWith('.html')).length
        : 0;
      const mtime = fs.statSync(path.join(OUTPUT_DIR, slug)).mtimeMs;
      return { slug, pngs, slides, mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);
  res.json(dirs);
});

app.get('/api/download/:slug', (req, res) => {
  const slug = req.params.slug;
  const pngDir = path.join(OUTPUT_DIR, slug, 'png');
  if (!fs.existsSync(pngDir)) return res.status(404).send('PNG 폴더 없음');

  res.attachment(`${slug}.zip`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => res.status(500).send(err.message));
  archive.pipe(res);
  archive.directory(pngDir, false);
  archive.finalize();
});

app.post('/api/render/:slug', (req, res) => {
  const slug = req.params.slug;
  const target = path.join('core/output', slug);
  if (!fs.existsSync(path.join(CORE, 'output', slug, 'slides'))) {
    return res.status(404).json({ error: 'slides 폴더 없음' });
  }
  const proc = spawn(process.execPath, ['core/extract.js', target], { cwd: ROOT });
  let log = '';
  proc.stdout.on('data', (d) => (log += d.toString()));
  proc.stderr.on('data', (d) => (log += d.toString()));
  proc.on('close', (code) => res.json({ code, log }));
});

app.listen(PORT, () => {
  console.log(`카드뉴스 컨트롤 패널: http://localhost:${PORT}`);
});
