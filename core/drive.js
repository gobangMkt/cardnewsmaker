'use strict';

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const CLIENT_PATH = path.join(__dirname, 'oauth-client.json');
const TOKEN_PATH = path.join(__dirname, 'oauth-token.json');
const OUTPUT_ROOT = path.join(__dirname, 'output');
const UPLOAD_DIR = path.join(OUTPUT_ROOT, 'upload');
const ARCHIVE_DIR = path.join(OUTPUT_ROOT, 'archive');

const PENDING_FOLDER_NAME = '대기중';
const DONE_FOLDER_NAME = '완료';

async function getAuth() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('토큰 없음. 먼저 실행하세요: node core/auth.js');
    process.exit(1);
  }
  const clientSecret = JSON.parse(fs.readFileSync(CLIENT_PATH));
  const { client_id, client_secret } = clientSecret.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3333');
  oauth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
  return oauth2Client;
}

async function findFolder(drive, name, parentId) {
  const q = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await drive.files.list({ q, fields: 'files(id,name)' });
  return res.data.files[0] || null;
}

async function listZipFiles(drive, folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name contains '.zip' and trashed=false`,
    fields: 'files(id,name)',
  });
  return res.data.files;
}

async function downloadFile(drive, fileId, destPath) {
  const dest = fs.createWriteStream(destPath);
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return new Promise((resolve, reject) => {
    res.data.pipe(dest);
    res.data.on('error', reject);
    dest.on('finish', resolve);
  });
}

async function findOrCreateFolder(drive, name, parentId) {
  const existing = await findFolder(drive, name, parentId);
  if (existing) return existing;
  const res = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id,name',
  });
  return res.data;
}

async function uploadFile(drive, folderId, filePath) {
  const name = path.basename(filePath);
  const res = await drive.files.create({
    requestBody: { name, parents: [folderId] },
    media: { mimeType: 'application/zip', body: fs.createReadStream(filePath) },
    fields: 'id',
  });
  return res.data.id;
}

async function moveFile(drive, fileId, newParentId, oldParentId) {
  await drive.files.update({
    fileId,
    addParents: newParentId,
    removeParents: oldParentId,
    fields: 'id',
  });
}

function extractUrlFromZipName(zipName) {
  const name = zipName.replace(/\.zip$/i, '');
  const shortMatch = name.match(/^(?:\[.+?\])?(\d+)$/);
  if (shortMatch) return `https://gobang.kr/contents/${shortMatch[1]}`;
  if (name.startsWith('https___')) return 'https://' + name.slice('https___'.length).replace(/_/g, '/');
  if (name.startsWith('http___')) return 'http://' + name.slice('http___'.length).replace(/_/g, '/');
  return name;
}

function extractRequesterFromZipName(zipName) {
  const match = zipName.match(/^\[(.+?)\]/);
  return match ? match[1] : null;
}

function slugFromUrl(url) {
  const match = url.match(/\/(\d+)/g);
  const id = match ? match[match.length - 1].replace('/', '') : Date.now().toString();
  return id;
}

// 1차 실행: ZIP 다운로드 + 이미지 추출 + DRIVE_TASK 출력 + task.json 저장
async function processZip(drive, zipFile, pendingFolderId) {
  const url = extractUrlFromZipName(zipFile.name);
  const slug = slugFromUrl(url);
  const outputDir = path.join(OUTPUT_ROOT, `${slug}-drive`);
  const imgDir = path.join(outputDir, 'img');
  const tmpZip = path.join(OUTPUT_ROOT, `_tmp_${zipFile.id}.zip`);

  const requester = extractRequesterFromZipName(zipFile.name);

  if (fs.existsSync(path.join(outputDir, 'task.json'))) {
    console.log(`\n  ${zipFile.name} — 슬라이드 제작 중, 건너뜀`);
    return;
  }

  console.log(`\n처리 시작: ${zipFile.name}${requester ? ` (요청자: ${requester})` : ''}`);
  console.log(`  URL: ${url}`);
  console.log(`  출력: ${outputDir}`);

  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  await downloadFile(drive, zipFile.id, tmpZip);

  fs.mkdirSync(imgDir, { recursive: true });
  const zip = new AdmZip(tmpZip);
  zip.extractAllTo(imgDir, true);
  fs.unlinkSync(tmpZip);

  const images = fs.readdirSync(imgDir).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  console.log(`  이미지 ${images.length}개 추출됨`);

  const taskInfo = { url, contentId: slug, requester, driveFileId: zipFile.id, pendingFolderId };
  fs.writeFileSync(path.join(outputDir, 'task.json'), JSON.stringify(taskInfo, null, 2));

  console.log('\n===== DRIVE_TASK =====');
  console.log(JSON.stringify({
    url,
    slug: `${slug}-drive`,
    outputDir,
    imgDir,
    images: images.map(f => path.join(imgDir, f)),
  }));
  console.log('===== /DRIVE_TASK =====');
  console.log('\n  슬라이드 제작 후 drive.js 재실행하면 업로드됩니다.');
;
}

async function uploadPending(drive, doneFolderId, pendingFolderId) {
  const entries = fs.readdirSync(OUTPUT_ROOT).flatMap(name => {
    const taskPath = path.join(OUTPUT_ROOT, name, 'task.json');
    const pngDir = path.join(OUTPUT_ROOT, name, 'png');
    if (!fs.existsSync(taskPath) || !fs.existsSync(pngDir)) return [];
    const pngs = fs.readdirSync(pngDir).filter(f => f.endsWith('.png')).sort();
    return pngs.length > 0 ? [{ name, pngs }] : [];
  });

  if (entries.length === 0) {
    console.log('업로드할 항목이 없어요. (task.json + png 폴더 모두 있어야 해요)');
    return;
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  const doneSubFolder = await findOrCreateFolder(drive, '작업완료', pendingFolderId);

  for (const { name, pngs } of entries) {
    const task = JSON.parse(fs.readFileSync(path.join(OUTPUT_ROOT, name, 'task.json')));
    const prefix = task.requester ? `[${task.requester}]` : '';
    const zipName = `${prefix}${task.contentId}-result.zip`;
    const zipPath = path.join(UPLOAD_DIR, zipName);

    const zip = new AdmZip();
    for (const png of pngs) zip.addLocalFile(path.join(OUTPUT_ROOT, name, 'png', png));
    zip.writeZip(zipPath);

    await uploadFile(drive, doneFolderId, zipPath);
    console.log(`  완료 폴더에 업로드: ${zipName} (${pngs.length}장)`);

    fs.renameSync(zipPath, path.join(ARCHIVE_DIR, zipName));

    const srcFolderId = task.pendingFolderId || pendingFolderId;
    try {
      await moveFile(drive, task.driveFileId, doneSubFolder.id, srcFolderId);
      console.log(`  대기중/작업완료 폴더로 이동: ${task.contentId}.zip`);
    } catch (e) {
      console.log(`  원본 ZIP 이동 실패 (이미 이동됐을 수 있음): ${e.message}`);
    }

    fs.unlinkSync(path.join(OUTPUT_ROOT, name, 'task.json'));
  }
}

(async () => {
  const authClient = await getAuth();
  const drive = google.drive({ version: 'v3', auth: authClient });

  const pendingFolder = await findFolder(drive, PENDING_FOLDER_NAME);
  const doneFolder = await findFolder(drive, DONE_FOLDER_NAME);

  if (!pendingFolder) {
    console.error(`"${PENDING_FOLDER_NAME}" 폴더를 찾을 수 없어요.`);
    process.exit(1);
  }
  if (!doneFolder) {
    console.error(`"${DONE_FOLDER_NAME}" 폴더를 찾을 수 없어요.`);
    process.exit(1);
  }

  console.log(`대기중 폴더 ID: ${pendingFolder.id}`);
  console.log(`완료 폴더 ID: ${doneFolder.id}`);

  const zipFiles = await listZipFiles(drive, pendingFolder.id);

  if (zipFiles.length > 0) {
    console.log(`${zipFiles.length}개 발견: ${zipFiles.map(f => f.name).join(', ')}`);
    for (const zipFile of zipFiles) {
      try {
        await processZip(drive, zipFile, pendingFolder.id);
      } catch (err) {
        console.error(`  오류: ${zipFile.name}`, err.message);
      }
    }
  }

  await uploadPending(drive, doneFolder.id, pendingFolder.id);
})().catch(err => { console.error(err); process.exit(1); });
