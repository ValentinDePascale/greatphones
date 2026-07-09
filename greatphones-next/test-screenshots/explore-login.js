const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errors = [];

  p.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  p.on('pageerror', err => errors.push(err.message));

  // 1. Go to login page
  await p.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(2000);
  console.log('=== LOGIN PAGE ===');
  console.log('URL:', p.url());

  // Inspect login form
  const inputs = await p.locator('input').all();
  for (let inp of inputs) {
    const id = await inp.getAttribute('id');
    const type = await inp.getAttribute('type');
    const placeholder = await inp.getAttribute('placeholder');
    const name = await inp.getAttribute('name');
    console.log('Input:', id || '', type || '', placeholder || '', name || '');
  }

  const buttons = await p.locator('button, [type=submit]').all();
  for (let btn of buttons) {
    const t = await btn.textContent();
    const id = await btn.getAttribute('id');
    console.log('Button:', id || '', (t || '').trim().substring(0, 50));
  }

  // Check if there's an email/password form or just social login
  const form = await p.locator('form').all();
  console.log('Forms found:', form.length);
  for (let f of form) {
    const html = await f.innerHTML();
    console.log('Form HTML (first 500):', html.substring(0, 500));
  }

  // 2. Try to navigate to admin directly via URL
  await p.goto('http://localhost:3000/admin', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(2000);
  console.log('\n=== ADMIN PAGE ===');
  console.log('URL:', p.url());

  // Check if redirected
  if (!p.url().includes('admin')) {
    console.log('Redirected to:', p.url());
  }

  // Check admin content
  const adminPage = await p.locator('#p-admin');
  const display = await adminPage.evaluate(el => getComputedStyle(el).display);
  console.log('#p-admin display:', display);
  const adminLayout = await p.locator('#admin-layout');
  const layoutDisplay = await adminLayout.evaluate(el => getComputedStyle(el).display);
  console.log('#admin-layout display:', layoutDisplay);

  // Check for login form on the page
  const loginEmail = await p.locator('#adUser, #email, input[type=email]').first();
  const loginPass = await p.locator('#adPass, #password, input[type=password]').first();
  if (await loginEmail.isVisible()) {
    console.log('Login form is visible');
    const emailPlaceholder = await loginEmail.getAttribute('placeholder');
    console.log('Email placeholder:', emailPlaceholder);
  }

  console.log('\n=== ERRORS ===');
  errors.forEach(e => console.log(e.substring(0, 200)));

  await b.close();
})();
