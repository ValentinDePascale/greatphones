const { readFileSync, readdirSync } = require('fs')
const { join } = require('path')
const shell = readFileSync('public/index.html', 'utf-8')
const dir = 'public/pages'
const home = readFileSync(join(dir, 'home.html'), 'utf-8')
let all = home
const files = readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'home.html')
files.forEach(f => { all += readFileSync(join(dir, f), 'utf-8') })
let html = shell.replace('</body>', all + '</body>')
html = html.replace(/class="page"(?! act)/g, 'class="page" style="display:none"')
html = html.replace(/style="display:none"([^>]*?)style="([^"]+)"/g, 'style="display:none;$2"$1')
// Check
const epIdx = html.indexOf('id="p-edit-profile"')
console.log('EP:', html.substring(epIdx - 30, epIdx + 150))
const shopIdx = html.indexOf('id="p-shop"')
console.log('SHOP:', html.substring(shopIdx - 30, shopIdx + 40))
const homeIdx = html.indexOf('id="p-home"')
console.log('HOME:', html.substring(homeIdx - 30, homeIdx + 40))
console.log('Dual style count:', (html.match(/style="display:none".*?style="/g) || []).length)
