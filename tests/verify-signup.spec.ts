import { test, expect } from '@playwright/test';

test('verify signup flow and dashboard access', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const name = `Tester ${timestamp}`;
    const password = 'password123';

    console.log(`Creating user: ${email}`);

    // Open login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    // Switch to signup
    await page.getByText('Create Account').click();

    // Fill signup form
    await page.getByPlaceholder('Display Name').fill(name);
    await page.getByPlaceholder('Email Address').fill(email);
    await page.getByPlaceholder('Password').fill(password);

    // Submit
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for dashboard (URL-based, reliable)
    await page.waitForURL(/localhost:3000\/?$/, { timeout: 10000 });

    console.log('Navigated to Dashboard');

    // Assert dashboard state
    await expect(page).toHaveURL(/localhost:3000\/?$/);
    await expect(page.getByText('Task Workspace')).toBeVisible();
});
