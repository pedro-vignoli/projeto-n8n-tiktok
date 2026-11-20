// Returns a valid access token, refreshing it with the saved refresh_token when needed.
// The token file is created by scripts/authorize.js.
const fs = require('fs');
const https = require('https');

const TOKEN_FILE = '/home/node/.n8n/tiktok.json';

let creds;
try {
  creds = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
} catch (e) {
  throw new Error('Missing ' + TOKEN_FILE + ': run scripts/authorize.js first');
}

const post = (url, body) => new Promise((resolve, reject) => {
  const req = https.request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
  }, res => {
    const parts = [];
    res.on('data', d => parts.push(d));
    res.on('end', () => resolve(JSON.parse(Buffer.concat(parts).toString())));
  });
  req.on('error', reject);
  req.end(body);
});

if (!creds.access_token || Date.now() > creds.expires_at - 60000) {
  const r = await post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
    client_key: creds.client_key,
    client_secret: creds.client_secret,
    grant_type: 'refresh_token',
    refresh_token: creds.refresh_token
  }).toString());
  if (!r.access_token) throw new Error('TikTok refused the refresh: ' + JSON.stringify(r));
  creds.access_token = r.access_token;
  creds.refresh_token = r.refresh_token || creds.refresh_token;
  creds.expires_at = Date.now() + r.expires_in * 1000;
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(creds, null, 2));
}

return $input.all().map(i => ({ json: { ...i.json, access_token: creds.access_token } }));
