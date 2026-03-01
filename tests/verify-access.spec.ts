
import { test, expect } from '@playwright/test';

test('verify app access and login page redirect', async ({ page }) => {
    // Increase timeout to 30s to allow WelcomeSequence and all redirects
    test.setTimeout(30000);

    // Go to the app root
    await page.goto('http://localhost:3000/AWAKE/');

    // Wait for the URL to eventually contain /login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 20000 });

    // Check for the "Welcome Back" text specifically found in the Login component
    await expect(page.getByText('Welcome Back')).toBeVisible({ timeout: 10000 });

    // Check for the "Sign In" button
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshot-access.png' });
});
