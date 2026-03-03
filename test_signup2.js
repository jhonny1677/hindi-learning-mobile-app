const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 400, height: 800 });

  const logs = [];
  page.on('console', msg => {
    const text = msg.text().substring(0, 300);
    logs.push(`[${msg.type()}] ${text}`);
    if (msg.type() !== 'log') console.log(`[${msg.type()}]`, text);
  });
  page.on('pageerror', err => { console.log('PAGE ERROR:', err.message); logs.push('PAGE ERROR: ' + err.message); });
  page.on('dialog', async dialog => {
    console.log('DIALOG:', dialog.message());
    logs.push('DIALOG: ' + dialog.message());
    await dialog.accept();
  });

  await page.goto('http://localhost:8081', { timeout: 30000 });
  await page.waitForTimeout(7000);
  try { await page.getByText('Skip').click({ timeout: 3000 }); } catch(e) {}
  await page.waitForTimeout(1500);

  await page.getByText('Sign In').first().click();
  await page.waitForTimeout(1500);
  await page.getByText('Sign Up').click();
  await page.waitForTimeout(800);

  await page.getByPlaceholder('Your name').fill('Test User');
  await page.getByPlaceholder('you@example.com').fill('test@example.com');
  await page.getByPlaceholder('At least 6 characters').fill('password123');
  await page.getByPlaceholder('Repeat your password').fill('password123');

  // Find and click the Create Account button via JS evaluate
  const clicked = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    const btn = divs.find(d => d.textContent && d.textContent.trim() === 'Create Account' && d.style.backgroundColor);
    if (btn) { btn.click(); return 'clicked parent'; }
    const allWithText = divs.filter(d => d.textContent && d.textContent.includes('Create Account'));
    // Click the one that's a button-like element
    for (const el of allWithText) {
      if (el.onclick || el.getAttribute('role') === 'button') { el.click(); return 'clicked role button'; }
    }
    // Fallback: click by position
    return 'none found';
  });
  console.log('Click result:', clicked);

  // Also try: click the primary button (indigo background)
  await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    for (const d of allDivs) {
      const style = window.getComputedStyle(d);
      if (style.backgroundColor && style.backgroundColor.includes('79') && d.textContent.includes('Create Account')) {
        d.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return;
      }
    }
  });

  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'signup_after_click.png' });
  console.log('All logs:', logs.join('\n'));

  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); });
