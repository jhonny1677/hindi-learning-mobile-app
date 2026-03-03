const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 400, height: 800 });

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warn') console.log(`[${msg.type()}]`, msg.text().substring(0, 200));
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('dialog', async dialog => {
    console.log('DIALOG:', dialog.type(), '|', dialog.message());
    await dialog.accept();
  });

  await page.goto('http://localhost:8081', { timeout: 30000 });
  await page.waitForTimeout(7000);

  try { await page.getByText('Skip').click({ timeout: 3000 }); } catch(e) {}
  await page.waitForTimeout(1500);

  // Open auth modal
  await page.getByText('Sign In').first().click();
  await page.waitForTimeout(1500);

  // Switch to Sign Up tab
  await page.getByText('Sign Up').click();
  await page.waitForTimeout(800);

  // Fill form
  await page.getByPlaceholder('Your name').fill('Test User');
  await page.getByPlaceholder('you@example.com').fill('test@example.com');
  await page.getByPlaceholder('At least 6 characters').fill('password123');
  await page.getByPlaceholder('Repeat your password').fill('password123');
  console.log('Form filled');

  // Click the submit button (primary button, not the tab text)
  await page.locator('button, [role="button"]').filter({ hasText: 'Create Account' }).first().click().catch(async () => {
    // fallback: press Enter
    await page.keyboard.press('Enter');
  });

  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'signup_result.png' });
  console.log('Done - check signup_result.png');

  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
