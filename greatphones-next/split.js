const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs')
const { join } = require('path')

const html = readFileSync('public/index.html', 'utf-8')
const dir = 'public/pages'
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

// Find all page divs
const pages = []
let pos = 0
while (pos < html.length) {
  const start = html.indexOf('<div class="page', pos)
  if (start === -1) break
  const endTag = html.indexOf('>', start)
  const tag = html.substring(start, endTag + 1)
  const idMatch = tag.match(/id="p-(\w[\w-]*)"/)
  const actMatch = tag.includes('page act')
  if (idMatch) {
    pages.push({ id: idMatch[1], pos: start, home: actMatch })
  }
  pos = endTag + 1
}

console.log('Found', pages.length, 'pages')

// Extract prefix (before first page)
const prefix = html.substring(0, pages[0].pos)

// Find scripts section: first <script> tag after the last page's closing div
// The last page content ends around line 3145
// Find the last </div> before scripts
const lastPageEnd = pages[pages.length - 1].pos
// Search for <script> after last page
const scriptStart = html.indexOf('<script>', lastPageEnd)
const suffix = scriptStart > 0 ? html.substring(scriptStart) : ''

// Extract each page content
pages.forEach((p, i) => {
  const end = i < pages.length - 1 ? pages[i + 1].pos : (scriptStart > 0 ? scriptStart : html.length)
  const content = html.substring(p.pos, end)
  writeFileSync(join(dir, p.id + '.html'), content, 'utf-8')
  console.log(`  ${p.id}.html`.padEnd(22) + content.length.toLocaleString() + ' bytes')
})

// Write shell (prefix + scripts)
writeFileSync('public/index.html', prefix + suffix, 'utf-8')

console.log(`\nOriginal: ${html.length.toLocaleString()} bytes`)
console.log(`Shell: ${(prefix + suffix).length.toLocaleString()} bytes`)
