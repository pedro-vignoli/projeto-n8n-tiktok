// Lists today's videos that were not posted to TikTok yet.
// Folder layout: /data/videos/Posts/<YYYY-MM-DD>/*.mp4
const fs = require('fs');

const TIMEZONE = 'UTC'; // change to your time zone, e.g. 'America/New_York'
const BASE = '/data/videos/Posts';

const today = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
const dir = BASE + '/' + today;
if (!fs.existsSync(dir)) return [];

let tags = '';
try {
  tags = fs.readFileSync(BASE + '/tags-tiktok.txt', 'utf8').replace(/\s+/g, ' ').trim();
} catch (e) {}

const items = [];
for (const file of fs.readdirSync(dir).sort()) {
  if (!file.toLowerCase().endsWith('.mp4')) continue;
  const name = file.slice(0, -4);
  const marker = dir + '/' + name + '.tiktok.ok';
  if (fs.existsSync(marker)) continue;
  items.push({ json: { dir, file, path: dir + '/' + file, name, marker, tags } });
}
return items;
