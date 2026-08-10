import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const htmlPath = join(process.cwd(), 'public', 'index.html')
const pagesDir = join(process.cwd(), 'public', 'pages')
const html = readFileSync(htmlPath, 'utf-8')

if (!existsSync(pagesDir)) mkdirSync(pagesDir, { recursive: true })

// Find all page section starts
const pageStarts: { id: string; pos: number; isHome: boolean }[] = []
const re = /<div class="page( act)?" id="p-(\w[\w-]*)"/g
let m: RegExpExecArray | null
while ((m = re.exec(html)) !== null) {
  pageStarts.push({ id: m[2], pos: m.index, isHome: !!m[1] })
}

// Extract prefix (before first page)
const prefix = html.substring(0, pageStarts[0].pos)

// Find scripts section
const scriptIdx = html.indexOf('<script>\nvar API_URL')
const suffix = scriptIdx > 0 ? html.substring(scriptIdx) : ''

// Map of page ID -> filename
const pageFiles: string[] = []

for (let i = 0; i < pageStarts.length; i++) {
  const p = pageStarts[i]
  const start = p.pos
  const end = i < pageStarts.length - 1 ? pageStarts[i + 1].pos : scriptIdx > 0 ? scriptIdx : html.length

  let content = html.substring(start, end)

  // For home page, include the "act" class so nav() works correctly
  if (p.isHome) {
    // Already has act class
  }

  writeFileSync(join(pagesDir, p.id + '.html'), content, 'utf-8')
  pageFiles.push(p.id)
  console.log(`  ✅ ${p.id}.html`.padEnd(25) + `${content.length.toLocaleString()} bytes`)
}

// Write shell (same as before: prefix + suffix)
writeFileSync(htmlPath, prefix + suffix, 'utf-8')

console.log(`\n📦 Original index.html: ${html.length.toLocaleString()} bytes`)
console.log(`🐚 Shell (head+nav+scripts): ${(prefix + suffix).length.toLocaleString()} bytes`)
console.log(`📄 ${pageStarts.length} pages extracted to public/pages/`)
