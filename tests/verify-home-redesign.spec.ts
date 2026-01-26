import { test, expect } from '@playwright/test';

test.describe('Home Screen Redesign Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Log in first (simplified if possible, reusing auth logic from other tests)
        const email = `testuser_${Date.now()}@example.com`;
        const name = 'Test User';

        await page.goto('http://localhost:3000/login');
        await page.getByText('Create Account').click();
        await page.getByPlaceholder('Display Name').fill(name);
        await page.getByPlaceholder('Email Address').fill(email);
        await page.getByPlaceholder('Password').fill('password123');
        await page.getByRole('button', { name: 'Sign Up' }).click();

        await page.waitForURL('http://localhost:3000/');
    });

    test('Zone 1: Routine Command Center', async ({ page }) => {
        // Check for Date (formatted loosely as it changes)
        // Check for GO Button
        await expect(page.getByRole('button', { name: 'GO' })).toBeVisible();
        await expect(page.getByText('Routine not started')).toBeVisible();
    });

    test('Zone 2: Support Modules', async ({ page }) => {
        // Check for Cards
        await expect(page.locator('text=Tasks').first()).toBeVisible();
        await expect(page.locator('text=Finance').first()).toBeVisible();
        await expect(page.locator('text=Vehicle').first()).toBeVisible();

        // Check Navigation
        await page.locator('text=Vehicle').first().click();
        await expect(page).toHaveURL(/.*\/vehicle/);
    });

    test('Zone 3: Wellness Insight', async ({ page }) => {
        const wellnessBtn = page.getByRole('button', { name: 'Show Wellness Insight' });
        await expect(wellnessBtn).toBeVisible();

        // Open Modal
        await wellnessBtn.click();
        await expect(page.getByText('Sunnah-Aligned Health')).toBeVisible();
        await expect(page.getByText('Today\'s Action')).toBeVisible();

        // Close Modal
        await page.getByRole('button', { name: 'Close Insight' }).click();
        await expect(page.getByText('Sunnah-Aligned Health')).not.toBeVisible();
    });

    test('Bottom Navigation Structure', async ({ page }) => {
        // Check distinct items
        // We can check by href or icon presence logic
        const nav = page.locator('.fixed.bottom-6'); // BottomNav container class
        await expect(nav).toBeVisible();

        // Count items (5 links: Home, Tasks, GO, Finance, Vehicle)
        const links = nav.locator('a');
        await expect(links).toHaveCount(5);

        // Verify GO link
        const goLink = nav.locator('a[href="/routine"]');
        await expect(goLink).toBeVisible();
    });
});
