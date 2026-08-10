const { readFileSync, existsSync, readdirSync } = require('fs')
const { join } = require('path')

const shell = readFileSync('public/index.html', 'utf-8')
const pagesDir = 'public/pages'
const files = readdirSync(pagesDir).filter(f => f.endsWith('.html') && f !== 'home.html').sort()

let allPages = readFileSync(join(pagesDir, 'home.html'), 'utf-8')
files.forEach(f => { allPages += readFileSync(join(pagesDir, f), 'utf-8') })

const html = shell.replace('</body>', allPages + '</body>')

// Check page class usage
const actCount = (html.match(/class="page act"/g) || []).length
const pageOnlyCount = (html.match(/class="page"/g) || []).length

console.log('page act:', actCount)
console.log('page (total):', pageOnlyCount)
console.log('Shell size:', shell.length)
console.log('Full HTML size:', html.length)
console.log('Has .page{display:none} in CSS:', html.includes('.page{display:none}'))
