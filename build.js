// Builds workflow/post-tiktok.json from the code files in nodes/.
// Usage: node build.js
const fs = require('fs');
const path = require('path');

const code = name => fs.readFileSync(path.join(__dirname, 'nodes', name), 'utf8');
const link = node => ({ node, type: 'main', index: 0 });

const workflow = {
  name: 'Post to TikTok',
  nodes: [
    { id: 't1', name: 'Start', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 0], parameters: {} },
    { id: 't2', name: 'List videos', type: 'n8n-nodes-base.code', typeVersion: 2, position: [220, 0], parameters: { jsCode: code('list-videos.js') } },
    { id: 't3', name: 'Get token', type: 'n8n-nodes-base.code', typeVersion: 2, position: [440, 0], parameters: { jsCode: code('get-token.js') } },
    { id: 't4', name: 'Each video', type: 'n8n-nodes-base.splitInBatches', typeVersion: 3, position: [660, 0], parameters: { batchSize: 1, options: {} } },
    { id: 't5', name: 'Post video', type: 'n8n-nodes-base.code', typeVersion: 2, position: [880, 100], onError: 'continueErrorOutput', parameters: { jsCode: code('post-video.js') } }
  ],
  connections: {
    'Start': { main: [[link('List videos')]] },
    'List videos': { main: [[link('Get token')]] },
    'Get token': { main: [[link('Each video')]] },
    'Each video': { main: [[], [link('Post video')]] },
    'Post video': { main: [[link('Each video')], [link('Each video')]] }
  },
  settings: { executionOrder: 'v1' }
};

const out = path.join(__dirname, 'workflow', 'post-tiktok.json');
fs.writeFileSync(out, JSON.stringify([workflow], null, 2) + '\n', 'utf8');
console.log('wrote ' + out);
