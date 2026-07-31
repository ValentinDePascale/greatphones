// DEPRECATED — do not run. This script overwrites public/index.html with stale partials from public/pages/*.html.
// The pages/home.html partial is outdated and would replace the current home page.
// Index.html is now the single source of truth. Pages are inline, not assembled from partials.
// If you need to rebuild from partials, update ALL partials first to match the current index.html content.

const { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } = require('fs');
const { join } = require('path');

const PUBLIC_DIR = join(__dirname, '..', 'public');
const PAGES_DIR = join(PUBLIC_DIR, 'pages');
const PARTIALS_DIR = join(PUBLIC_DIR, 'partials');

function readFile(path, fallback = '') {
  return existsSync(path) ? readFileSync(path, 'utf-8') : fallback;
}

function extractHead(html) {
  const match = html.match(/^[\s\S]*?(<div id="splash")/);
  return match ? html.substring(0, match.index) : '';
}

function extractScripts(html) {
  const match = html.match(/<script src="lib\/constants\.js"><\/script>[\s\S]*$/);
  return match ? match[0] : '';
}

function buildIndex() {
  const indexPath = join(PUBLIC_DIR, 'index.html');
  const backupPath = join(PUBLIC_DIR, 'index.html.bak');
  
  if (!existsSync(indexPath)) {
    console.error('index.html not found');
    return;
  }
  
  const mainHtml = readFile(indexPath);
  const head = extractHead(mainHtml);
  const scripts = extractScripts(mainHtml);
  
  const header = readFile(join(PARTIALS_DIR, 'header.html'));
  const footer = readFile(join(PARTIALS_DIR, 'footer.html'));
  
  if (!existsSync(PAGES_DIR)) {
    console.log('No pages directory, keeping original index.html');
    return;
  }
  
  const pageFiles = readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
  let pagesContent = '';
  
  pageFiles.forEach(f => {
    const pageHtml = readFile(join(PAGES_DIR, f));
    if (pageHtml) {
      pagesContent += pageHtml + '\n';
    }
  });
  
  const oldPattern = /<!-- ============================= PAGE: \w+ ============================= -->[\s\S]*?<\/div>\s*<!-- ============================= PAGE:/g;
  const newIndex = mainHtml.replace(oldPattern, '{{PAGES}}');
  
  const result = newIndex
    .replace('{{PAGES}}', pagesContent || '<!-- Pages loaded dynamically -->')
    .replace(/<script src="lib\/constants\.js"><\/script>[\s\S]*$/, scripts);
  
  writeFileSync(backupPath, mainHtml);
  writeFileSync(indexPath, result);
  
  console.log(`✓ Built index.html`);
  console.log(`  - Header: ${!!header}`);
  console.log(`  - Footer: ${!!footer}`);
  console.log(`  - Pages: ${pageFiles.length}`);
  console.log(`  - Backup: index.html.bak`);
}

buildIndex();