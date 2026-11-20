// One-time TikTok authorization. Saves the token inside the n8n container.
// Usage: node scripts/authorize.js
// Optional env: TT_KEY, TT_SECRET, TT_REDIRECT, TT_CODE, N8N_CONTAINER (default: n8n)
const readline = require('readline');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const container = process.env.N8N_CONTAINER || 'n8n';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));

(async () => {
  const client_key = (process.env.TT_KEY || await ask('Client key: ')).trim();
  const client_secret = (process.env.TT_SECRET || await ask('Client secret: ')).trim();
  const redirect = (process.env.TT_REDIRECT || await ask('Redirect URI registered in the app: ')).trim();

  const url = 'https://www.tiktok.com/v2/auth/authorize/?' + new URLSearchParams({
    client_key, scope: 'user.info.basic,video.publish', response_type: 'code',
    redirect_uri: redirect, state: 'n8n'
  });
  console.log('\nOpen this link in a browser logged in to the TikTok account:\n' + url);
  console.log('\nAfter you authorize, the address bar contains ?code=... (the page may show an error, that is fine).');
  if (!process.env.TT_CODE && process.env.TT_KEY) { rl.close(); return; }

  let code = (process.env.TT_CODE || await ask('Paste the full address (or just the code): ')).trim();
  const m = code.match(/[?&]code=([^&]+)/);
  if (m) code = m[1];
  code = decodeURIComponent(code);

  const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_key, client_secret, code, grant_type: 'authorization_code', redirect_uri: redirect })
  });
  const j = await r.json();
  if (!j.access_token) { console.error('Failed:', JSON.stringify(j)); process.exit(1); }

  const data = {
    client_key, client_secret,
    access_token: j.access_token, refresh_token: j.refresh_token,
    expires_at: Date.now() + j.expires_in * 1000, open_id: j.open_id
  };
  const tmp = path.join(os.tmpdir(), 'tiktok.json');
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  execFileSync('docker', ['cp', tmp, container + ':/home/node/.n8n/tiktok.json']);
  execFileSync('docker', ['exec', '-u', 'root', container, 'chown', 'node:node', '/home/node/.n8n/tiktok.json']);
  fs.unlinkSync(tmp);
  console.log('\nDone. Token saved in the n8n volume (scopes: ' + j.scope + ').');
  rl.close();
})();
