'use strict';

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CLIENT_PATH = path.join(__dirname, 'oauth-client.json');
const TOKEN_PATH = path.join(__dirname, 'oauth-token.json');

async function getAuth() {
  const clientSecret = JSON.parse(fs.readFileSync(CLIENT_PATH));
  const { client_id, client_secret } = clientSecret.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3333');
  oauth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
  return oauth2Client;
}

async function findFolder(drive, name) {
  const res = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)',
  });
  return res.data.files[0] || null;
}

(async () => {
  const authClient = await getAuth();
  const drive = google.drive({ version: 'v3', auth: authClient });

  const doneFolder = await findFolder(drive, '완료');
  if (!doneFolder) { console.error('"완료" 폴더를 찾을 수 없어요.'); process.exit(1); }

  const res = await drive.files.list({
    q: `'${doneFolder.id}' in parents and name contains '-result.zip' and trashed=false`,
    fields: 'files(id,name,createdTime)',
    orderBy: 'name,createdTime',
  });

  const files = res.data.files;
  console.log(`완료 폴더 파일 수: ${files.length}`);

  // 이름별로 그룹화 → 최신 1개 유지, 나머지 삭제
  const byName = {};
  for (const f of files) {
    if (!byName[f.name]) byName[f.name] = [];
    byName[f.name].push(f);
  }

  for (const [name, group] of Object.entries(byName)) {
    if (group.length <= 1) continue;
    // createdTime 기준 내림차순 정렬 → 가장 최신이 index 0
    group.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
    const toDelete = group.slice(1);
    for (const f of toDelete) {
      await drive.files.delete({ fileId: f.id });
      console.log(`  삭제: ${f.name} (${f.createdTime})`);
    }
  }

  console.log('\n중복 정리 완료.');
})().catch(err => { console.error(err); process.exit(1); });
