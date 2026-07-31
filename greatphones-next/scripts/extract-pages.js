// DEPRECATED — extracts page partials from index.html into public/pages/*.html.
// Useful for migrating from inline pages to partials, but build-html.js is not part of the pipeline.
// Run manually only if you need to synchronize partials after editing index.html.

const { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } = require('fs');
const { join } = require('path');

const PUBLIC_DIR = join(__dirname, '..', 'public');
const PAGES_DIR = join(PUBLIC_DIR, 'pages');

function extractPages() {
  const indexPath = join(PUBLIC_DIR, 'index.html');
  if (!existsSync(indexPath)) {
    console.error('index.html not found');
    return;
  }

  const html = readFileSync(indexPath, 'utf-8');
  
  const pattern = /<!-- ============================= PAGE: (\w+) ============================= -->\s*(<div class="page[^>]*id="p-(\w+)"[^>]*>)([\s\S]*?)<\/div>\s*(?=<!-- ============================= PAGE:|<script|<\/body)/g;
  
  let match;
  let count = 0;
  
  while ((match = pattern.exec(html)) !== null) {
    const pageName = match[1];
    const pageContent = match[2] + match[4] + '</div>';
    const fileName = pageName.toLowerCase().replace(' ', '-');
    
    writeFileSync(join(PAGES_DIR, `${fileName}.html`), pageContent);
    console.log(`Extracted: ${fileName}.html`);
    count++;
  }
  
  console.log(`\nDone! Extracted ${count} pages`);
}

extractPages();