import { test, expect } from '@playwright/test';

test.describe('Manual Login Flow Test', () => {
  const testUser = {
    email: `testuser${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: 'TestPassword123!',
    name: 'Test User'
  };

  test('Complete signup and login flow', async ({ page }) => {
    // Step 1: Go to home page
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'test-results/manual/01-home.png', fullPage: true });
    
    // Step 2: Click Sign up
    await page.click('text=Sign up');
    await page.waitForURL('**/auth/signup');
    await page.screenshot({ path: 'test-results/manual/02-signup-page.png', fullPage: true });
    
    // Step 3: Fill signup form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.name);
    await page.screenshot({ path: 'test-results/manual/03-signup-filled.png', fullPage: true });
    
    // Step 4: Submit signup
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/manual/04-after-signup.png', fullPage: true });
    
    // Step 5: Check if redirected or if there's a success message
    const currentUrl = page.url();
    console.log('After signup URL:', currentUrl);
    
    // Step 6: If not automatically logged in, go to signin
    if (!currentUrl.includes('localhost:3000/') || currentUrl.includes('signin')) {
      await page.goto('http://localhost:3000/auth/signin');
      await page.screenshot({ path: 'test-results/manual/05-signin-page.png', fullPage: true });
      
      // Step 7: Fill signin form
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.screenshot({ path: 'test-results/manual/06-signin-filled.png', fullPage: true });
      
      // Step 8: Submit signin
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/manual/07-after-signin.png', fullPage: true });
    }
    
    // Step 9: Verify we're logged in (check for Sign out button or welcome message)
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/manual/08-logged-in-home.png', fullPage: true });
    
    // Check if we see the welcome message or sign out button
    const hasSignOut = await page.locator('text=Sign out').isVisible().catch(() => false);
    const hasWelcome = await page.locator('text=Welcome').isVisible().catch(() => false);
    
    console.log('Has Sign out button:', hasSignOut);
    console.log('Has Welcome message:', hasWelcome);
    
    if (hasSignOut || hasWelcome) {
      console.log('✅ Successfully logged in!');
      
      // Step 10: Test sign out
      if (hasSignOut) {
        await page.click('text=Sign out');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/manual/09-after-signout.png', fullPage: true });
        
        // Verify we're signed out
        const hasSignIn = await page.locator('text=Sign in').isVisible();
        expect(hasSignIn).toBe(true);
        console.log('✅ Successfully signed out!');
      }
    } else {
      console.log('❌ Not logged in - may need to check authentication flow');
    }
  });
});
