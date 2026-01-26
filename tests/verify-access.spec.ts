
import { test, expect } from '@playwright/test';

test('verify app access and login page redirect', async ({ page }) => {
    // Go to the app root
    await page.goto('http://localhost:3000/');

    // Expect to be redirected to /login because authentication is required
    await expect(page).toHaveURL(/.*\/login/);

    // Check for the "Welcome Back" text specifically found in the Login component
    await expect(page.getByText('Welcome Back')).toBeVisible();

    // Check for the "Sign In" button
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // Take a screenshot for debugging purposes (optional, saved to test-results)
    await page.screenshot({ path: 'tests/screenshot-access.png' });
});
