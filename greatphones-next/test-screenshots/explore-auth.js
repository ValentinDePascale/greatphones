const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();

  // Go to home - all pages rendered
  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(2000);

  // Check the login form specifically
  const loginPage = p.locator('#p-login');
  const loginDisplay = await loginPage.evaluate(el => getComputedStyle(el).display);
  console.log('#p-login display:', loginDisplay);

  // Try to show login page and fill form
  // First navigate to login
  const loginBtn = p.locator('button:has-text("Iniciar sesión")').first();
  if (await loginBtn.isVisible()) {
    console.log('Login button visible, clicking...');
    await loginBtn.click();
    await p.waitForTimeout(1500);
  }

  const loginPage2 = p.locator('#p-login');
  const loginDisplay2 = await loginPage2.evaluate(el => getComputedStyle(el).display);
  console.log('#p-login display after click:', loginDisplay2);

  // Check login form elements
  const emailInput = p.locator('#loginEmail');
  const passInput = p.locator('#loginPassword');
  const submitBtn = p.locator('#p-login button:has-text("Iniciar sesión")');

  console.log('Email visible:', await emailInput.isVisible());
  console.log('Pass visible:', await passInput.isVisible());
  console.log('Submit visible:', await submitBtn.isVisible());

  // Try to register a new user
  const registerLink = p.locator('#p-login button:has-text("Registrate"), #p-login a:has-text("Registrate")').first();
  if (await registerLink.isVisible()) {
    console.log('Register link visible, clicking...');
    await registerLink.click();
    await p.waitForTimeout(1500);
  }

  const registerPage = p.locator('#p-register');
  const regDisplay = await registerPage.evaluate(el => getComputedStyle(el).display);
  console.log('#p-register display:', regDisplay);

  // Check register form elements
  const regName = p.locator('#regName');
  const regLastname = p.locator('#regLastname');
  const regEmail = p.locator('#regEmail');
  const regPass = p.locator('#regPassword');
  const regConfirm = p.locator('#regConfirmPassword');
  const regTyC = p.locator('#regTyC');
  const regSubmit = p.locator('#p-register button:has-text("Crear cuenta")');

  console.log('Register form fields visible:',
    await regName.isVisible(),
    await regLastname.isVisible(),
    await regEmail.isVisible(),
    await regPass.isVisible(),
    await regConfirm.isVisible(),
    await regTyC.isVisible(),
    await regSubmit.isVisible()
  );

  await p.screenshot({ path: 'test-screenshots/login-register.png', fullPage: true });

  await b.close();
})();
