// Test: what does serveSpa actually produce?
const { existsSync, readdirSync } = require('fs')
const { join } = require('path')
const shell = require('fs').readFileSync('public/index.html', 'utf-8')
const pagesDir = 'public/pages'
const files = readdirSync(pagesDir).filter(f => f.endsWith('.html') && f !== 'home.html')

// Simulate loadAllPages
const home = require('fs').readFileSync(join(pagesDir, 'home.html'), 'utf-8')
let allPages = home
files.forEach(f => { allPages += require('fs').readFileSync(join(pagesDir, f), 'utf-8') })

// Simulate serveSpa('home')
let homeSpa = shell.replace('</body>', allPages + '</body>')

// Check critical things
console.log('1. edit-profile present:', homeSpa.includes('p-edit-profile'))
console.log('2. edit-profile has page class:', homeSpa.match(/id="p-edit-profile"[^>]*class="page"/) ? 'YES' : 'NO')
console.log('3. edit-profile exact start:', homeSpa.substring(homeSpa.indexOf('id="p-edit-profile"')-30, homeSpa.indexOf('id="p-edit-profile"')+60))
console.log('4. navRedirect present:', homeSpa.includes('navRedirect'))
console.log('5. navigation.js script:', homeSpa.match(/navigation.js\?v=4/)?.[0] || 'NOT FOUND')
console.log('6. render.js script:', homeSpa.match(/render.js\?v=4/)?.[0] || 'NOT FOUND')
console.log('7. admin.js script:', homeSpa.match(/admin.js\?v=4/)?.[0] || 'NOT FOUND')
console.log('8. Total HTML size:', homeSpa.length)
console.log('9. Has <main id="main-content">:', homeSpa.includes('main-content'))

// Simulate serveSpa('shop')
const shopPage = require('fs').readFileSync(join(pagesDir, 'shop.html'), 'utf-8')
const shopAct = shopPage.replace('class="page" id="p-shop"', 'class="page act" id="p-shop"')
let shopSpa = shell.replace('</body>', shopAct + '</body>')
shopSpa = shopSpa.replace('<body>', '<body><main id="main-content">').replace('</body>', '</main></body>')

console.log('\n10. shop HTML size:', shopSpa.length)
console.log('11. shop has p-shop:', shopSpa.includes('p-shop'))
console.log('12. shop has p-ofertas:', shopSpa.includes('p-ofertas'))
console.log('13. shop has p-edit-profile:', shopSpa.includes('p-edit-profile'))
console.log('14. shop has navRedirect:', shopSpa.includes('navRedirect'))
console.log('15. shop has navigation.js:', shopSpa.includes('navigation.js'))
