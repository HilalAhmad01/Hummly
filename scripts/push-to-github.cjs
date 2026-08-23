const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGhToken() {
  return execSync('gh auth token', { encoding: 'utf8' }).trim();
}

const TOKEN = getGhToken();
const REPO = 'HilalAhmad01/Hummly';

async function ghFetch(endpoint, method = 'GET', body = null) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Hummly-Deployer',
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub API Error ${res.status}: ${errText}`);
  }
  return res.json();
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        getAllFiles(filePath, fileList);
      }
    } else {
      if (!file.endsWith('.cjs') && !filePath.includes('.system_generated')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

async function main() {
  console.log('🚀 Syncing full Hummly codebase to GitHub...');

  // 1. Get latest commit SHA on main
  const refData = await ghFetch('/git/refs/heads/main');
  const baseCommitSha = refData.object.sha;
  console.log('Base commit SHA:', baseCommitSha);

  const baseCommit = await ghFetch(`/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  // 2. Read all files
  const rootDir = process.cwd();
  const allFiles = getAllFiles(rootDir);
  console.log(`Found ${allFiles.length} files to sync.`);

  const treeEntries = [];

  for (let i = 0; i < allFiles.length; i++) {
    const f = allFiles[i];
    const relPath = path.relative(rootDir, f).replace(/\\/g, '/');
    const fileBuffer = fs.readFileSync(f);
    const base64Content = fileBuffer.toString('base64');

    const blob = await ghFetch('/git/blobs', 'POST', {
      content: base64Content,
      encoding: 'base64',
    });

    treeEntries.push({
      path: relPath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });

    if ((i + 1) % 10 === 0 || i === allFiles.length - 1) {
      console.log(`Uploaded ${i + 1}/${allFiles.length} files...`);
    }
  }

  // 3. Create tree
  console.log('Creating Git tree...');
  const newTree = await ghFetch('/git/trees', 'POST', {
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  // 4. Create commit
  console.log('Creating commit...');
  const newCommit = await ghFetch('/git/commits', 'POST', {
    message: 'feat: complete Hummly codebase with Next.js, Supabase, and Google OAuth',
    tree: newTree.sha,
    parents: [baseCommitSha],
  });

  // 5. Update ref
  console.log('Updating main branch reference...');
  await ghFetch('/git/refs/heads/main', 'PATCH', {
    sha: newCommit.sha,
    force: true,
  });

  console.log('🎉 SUCCESS! All files have been published to https://github.com/HilalAhmad01/Hummly');
}

main().catch((err) => {
  console.error('Push failed:', err);
  process.exit(1);
});
