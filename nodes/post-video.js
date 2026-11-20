// Posts one video: init -> upload -> status check -> marker file.
const fs = require('fs');
const https = require('https');

const item = $input.first().json;

// An app that has not passed the TikTok audit can only post with SELF_ONLY.
// After approval, change it to 'PUBLIC_TO_EVERYONE'.
const PRIVACY = 'SELF_ONLY';

const request = (url, method, headers, body) => new Promise((resolve, reject) => {
  const req = https.request(url, { method, headers: { ...headers, 'Content-Length': body.length } }, res => {
    const parts = [];
    res.on('data', d => parts.push(d));
    res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(parts).toString() }));
  });
  req.on('error', reject);
  req.end(body);
});

const api = async (url, body) => {
  const r = await request(url, 'POST', {
    Authorization: 'Bearer ' + item.access_token,
    'Content-Type': 'application/json; charset=UTF-8'
  }, Buffer.from(JSON.stringify(body)));
  return JSON.parse(r.text);
};

const video = fs.readFileSync(item.path);
const size = video.length;
const chunk = size <= 64 * 1024 * 1024 ? size : 50 * 1024 * 1024;
const chunks = Math.floor(size / chunk);

const init = await api('https://open.tiktokapis.com/v2/post/publish/video/init/', {
  post_info: { title: item.tags, privacy_level: PRIVACY, disable_duet: false, disable_comment: false, disable_stitch: false },
  source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: chunk, total_chunk_count: chunks }
});
if (!init.data || !init.data.upload_url) throw new Error('init failed: ' + JSON.stringify(init));
const { upload_url, publish_id } = init.data;

for (let i = 0; i < chunks; i++) {
  const start = i * chunk;
  const end = i === chunks - 1 ? size : start + chunk;
  const r = await request(upload_url, 'PUT', {
    'Content-Type': 'video/mp4',
    'Content-Range': 'bytes ' + start + '-' + (end - 1) + '/' + size
  }, video.subarray(start, end));
  if (r.status >= 300) throw new Error('upload failed: ' + r.status + ' ' + r.text);
}

let status = '';
for (let attempt = 0; attempt < 12; attempt++) {
  await new Promise(r => setTimeout(r, 10000));
  const s = await api('https://open.tiktokapis.com/v2/post/publish/status/fetch/', { publish_id });
  status = (s.data && s.data.status) || '';
  if (status === 'PUBLISH_COMPLETE') break;
  if (status === 'FAILED') throw new Error('TikTok failed: ' + JSON.stringify(s.data));
}

fs.writeFileSync(item.marker, new Date().toISOString() + ' ' + publish_id + ' ' + status + '\n');
return [{ json: { file: item.file, publish_id, status } }];
