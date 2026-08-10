// Test serveSpa output
const { readFileSync, readdirSync } = require('fs')
const { join } = require('path')

// Replicate serveSpa logic
const shell = readFileSync('public/index.html', 'utf-8')
const dir = 'public/pages'
const home = readFileSync(join(dir, 'home.html'), 'utf-8')
let all = home
const files = readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'home.html')
files.forEach(f => { all += readFileSync(join(dir, f), 'utf-8') })
let html = shell.replace('</body>', all + '</body>')
html = html.replace(/class="page"(?! act)/g, 'class="page" style="display:none"')
html = html.replace(/(style="display:none"[^>]*?)\s+style="[^"]*"/g, '$1')
html = html.replace('<body>', '<body><main id="main-content">').replace('</body>', '</main></body>')

// Check edit-profile
const epIdx = html.indexOf('id="p-edit-profile"')
const epTagStart = html.lastIndexOf('<', epIdx - 5)
const epTagEnd = html.indexOf('>', epIdx) + 1
const epTag = html.substring(epTagStart, epTagEnd)
console.log('Edit-profile opening tag:', epTag)

// Check how many pages have display:none
const noneCount = (html.match(/style="display:none"/g) || []).length
console.log('Pages with style="display:none":', noneCount)

// Check how many pages have page act class
const actCount = (html.match(/class="page act"/g) || []).length
console.log('Pages with class="page act":', actCount)

// Check if Seguridad section is inside a hidden div
const segIdx = html.indexOf('Seguridad y Otros')
if (segIdx > -1) {
  const before = html.substring(Math.max(0, segIdx - 200), segIdx)
  // Find the nearest page div before this
  const pageMatch = before.match(/class="page[^"]*"\s+(?:style="[^"]*"\s+)?id="(p-\w[\w-]*)"/g)
  if (pageMatch) {
    const last = pageMatch[pageMatch.length - 1]
    console.log('Seguridad is inside:', last)
  }
}
