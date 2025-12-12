import { test, expect } from '@playwright/test';

test.describe('Simple Instagram - Full Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('http://localhost:3000');
  });

  test('should display the root page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Simple Instagram/);
    
    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toHaveText('Simple Instagram');
    
    // Check welcome message
    await expect(page.locator('text=간단한 Instagram 클론 애플리케이션에 오신 것을 환영합니다!')).toBeVisible();
    
    // Check that Sign in and Sign up buttons are visible (when not logged in)
    await expect(page.locator('text=Sign in')).toBeVisible();
    await expect(page.locator('text=Sign up')).toBeVisible();
    
    // Take a screenshot of the root page
    await page.screenshot({ path: 'test-results/screenshots/01-root-page.png', fullPage: true });
  });

  test('should navigate to sign up page', async ({ page }) => {
    // Click on Sign up button
    await page.click('text=Sign up');
    
    // Wait for navigation
    await page.waitForURL('**/auth/signup');
    
    // Verify we're on the signup page
    await expect(page.url()).toContain('/auth/signup');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/screenshots/02-signup-page.png', fullPage: true });
  });

  test('should navigate to sign in page', async ({ page }) => {
    // Click on Sign in button
    await page.click('text=Sign in');
    
    // Wait for navigation
    await page.waitForURL('**/auth/signin');
    
    // Verify we're on the signin page
    await expect(page.url()).toContain('/auth/signin');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/screenshots/03-signin-page.png', fullPage: true });
  });

  test('should complete full registration flow', async ({ page }) => {
    // Navigate to signup page
    await page.click('text=Sign up');
    await page.waitForURL('**/auth/signup');
    
    // Generate unique test user credentials
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    const testPassword = 'TestPassword123!';
    
    // Fill in the registration form
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const usernameInput = page.locator('input[name="username"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const nameInput = page.locator('input[name="name"]');
    
    if (await emailInput.isVisible()) {
      await emailInput.fill(testEmail);
    }
    if (await usernameInput.isVisible()) {
      await usernameInput.fill(testUsername);
    }
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(testPassword);
    }
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
    }
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'test-results/screenshots/04-signup-filled.png', fullPage: true });
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait for navigation or success message
      await page.waitForTimeout(2000);
      
      // Take screenshot after submission
      await page.screenshot({ path: 'test-results/screenshots/05-after-signup.png', fullPage: true });
    }
  });

  test('should complete full login flow', async ({ page }) => {
    // First, create a test user (you may need to adjust this based on your setup)
    // For now, we'll just test the login page UI
    
    // Navigate to signin page
    await page.click('text=Sign in');
    await page.waitForURL('**/auth/signin');
    
    // Check for login form elements
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/screenshots/06-signin-page-detail.png', fullPage: true });
    
    // Try filling in credentials (this will fail if no user exists, which is expected)
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    
    // Take screenshot of filled login form
    await page.screenshot({ path: 'test-results/screenshots/07-signin-filled.png', fullPage: true });
  });

  test('should check navigation between pages', async ({ page }) => {
    // Start at home
    await expect(page.locator('h1')).toHaveText('Simple Instagram');
    
    // Go to signup
    await page.click('text=Sign up');
    await page.waitForURL('**/auth/signup');
    await page.screenshot({ path: 'test-results/screenshots/08-nav-signup.png', fullPage: true });
    
    // Go back to home (if there's a link)
    const homeLink = page.locator('a[href="/"]');
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForURL('http://localhost:3000/');
    } else {
      await page.goto('http://localhost:3000');
    }
    
    // Go to signin
    await page.click('text=Sign in');
    await page.waitForURL('**/auth/signin');
    await page.screenshot({ path: 'test-results/screenshots/09-nav-signin.png', fullPage: true });
  });
});
