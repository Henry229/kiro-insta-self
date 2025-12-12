import { chromium } from '@playwright/test';

async function testUI() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the homepage
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait for the header to be visible
    await page.waitForSelector('header', { timeout: 5000 });

    // Take a screenshot of the homepage
    await page.screenshot({ path: 'ui-test-homepage.png', fullPage: true });

    console.log('✅ Homepage loaded successfully');
    console.log('✅ Screenshot saved as ui-test-homepage.png');

    // Check if header elements exist
    const logo = await page.locator('text=Instagram').count();
    const homeLink = await page.locator('text=Home').count();
    const uploadLink = await page.locator('text=Upload').count();

    console.log('\n📊 UI Elements Check:');
    console.log(`  - Logo: ${logo > 0 ? '✅' : '❌'}`);
    console.log(`  - Home Link: ${homeLink > 0 ? '✅' : '❌'}`);
    console.log(`  - Upload Link: ${uploadLink > 0 ? '✅' : '❌'}`);

    // Test mobile navigation (resize to mobile)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'ui-test-mobile.png', fullPage: true });

    console.log('✅ Mobile screenshot saved as ui-test-mobile.png');

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'ui-test-tablet.png', fullPage: true });

    console.log('✅ Tablet screenshot saved as ui-test-tablet.png');

  } catch (error) {
    console.error('❌ Error during UI test:', error.message);
  } finally {
    await browser.close();
  }
}

testUI();
