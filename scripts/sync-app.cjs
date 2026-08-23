const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOKEN = execSync('gh auth token', { encoding: 'utf8' }).trim();
const REPO = 'HilalAhmad01/Hummly';

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 30000,
});

function ghRequest(endpoint, method, payload, retries = 3) {
  return new Promise((resolve, reject) => {
    const dataString = payload ? JSON.stringify(payload) : null;
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: `/repos/${REPO}${endpoint}`,
        method,
        agent,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Hummly-Fast-Sync',
          ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve(body);
            }
          } else {
            reject(new Error(`GitHub API ${res.statusCode} on ${endpoint}: ${body}`));
          }
        });
      }
    );

    req.on('error', async (err) => {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        ghRequest(endpoint, method, payload, retries - 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });

    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

function getAppFiles(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== 'node_modules' &&
        entry.name !== '.git' &&
        entry.name !== '.next' &&
        entry.name !== 'scripts' &&
        !entry.name.startsWith('.')
      ) {
        getAppFiles(fullPath, list);
      }
    } else {
      if (
        !entry.name.endsWith('.cjs') &&
        !entry.name.endsWith('.log') &&
        entry.name !== 'package-lock.json'
      ) {
        list.push(fullPath);
      }
    }
  }
  return list;
}

async function run() {
  console.log('🚀 Fast parallel sync to GitHub...');

  const refData = await ghRequest('/git/refs/heads/main', 'GET');
  const baseCommitSha = refData.object.sha;
  console.log('Current commit SHA:', baseCommitSha);

  const baseCommit = await ghRequest(`/git/commits/${baseCommitSha}`, 'GET');
  const baseTreeSha = baseCommit.tree.sha;

  const rootDir = process.cwd();
  const appFiles = getAppFiles(rootDir);
  console.log(`Found ${appFiles.length} clean source files.`);

  const tree = [];

  // Upload in parallel batches of 5
  const BATCH_SIZE = 5;
  for (let i = 0; i < appFiles.length; i += BATCH_SIZE) {
    const batch = appFiles.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (filePath) => {
        const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        const contentBuffer = fs.readFileSync(filePath);
        const base64Content = contentBuffer.toString('base64');

        const blob = await ghRequest('/git/blobs', 'POST', {
          content: base64Content,
          encoding: 'base64',
        });

        return {
          path: relPath,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        };
      })
    );

    tree.push(...results);
    console.log(`Uploaded ${tree.length}/${appFiles.length} files...`);
  }

  console.log('Building Git tree...');
  const newTree = await ghRequest('/git/trees', 'POST', {
    base_tree: baseTreeSha,
    tree,
  });

  console.log('Creating commit...');
  const newCommit = await ghRequest('/git/commits', 'POST', {
    message: 'feat: full Hummly Next.js game with Supabase database & Google OAuth',
    tree: newTree.sha,
    parents: [baseCommitSha],
  });

  console.log('Updating GitHub main branch...');
  await ghRequest('/git/refs/heads/main', 'PATCH', {
    sha: newCommit.sha,
    force: true,
  });

  console.log('🎉 ALL SOURCE FILES SUCCESSFULLY PUBLISHED TO GITHUB!');
}

run().catch((e) => {
  console.error('Sync failed:', e);
  process.exit(1);
});
