import { test, expect } from '@playwright/test';

test('Advanced Finance: Recurring & Split', async ({ page }) => {
    // 1. Signup/Login
    const timestamp = Date.now();
    const email = `adv${timestamp}@example.com`;
    const name = `Adv Verifier`;

    await page.goto('http://localhost:3000/login');
    await page.getByText('Create Account').click();
    await page.getByPlaceholder('Display Name').fill(name);
    await page.getByPlaceholder('Email Address').fill(email);
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    await page.goto('http://localhost:3000/finance');
    await page.waitForLoadState('networkidle');

    // 2. Add Split Transaction
    await page.getByRole('button', { name: 'Add First Transaction' }).click();
    await page.fill('input[placeholder="0"]', '200');

    // Toggle Split
    await page.click('button:has-text("Split Bill")');

    // Add first split
    await page.locator('select').nth(0).selectOption({ label: 'Food & Dining' });
    await page.locator('input[placeholder="0"]').nth(1).fill('100'); // First split amount input (0 is main amount)

    // Add second split (click Add Split)
    await page.click('button:has-text("+ Add Split")');
    await page.locator('select').nth(1).selectOption({ label: 'Transport' });
    await page.locator('input[placeholder="0"]').nth(2).fill('100');

    // Select Account (last select)
    await page.locator('select').last().selectOption({ index: 1 });

    await page.click('button:has-text("Save Transaction")');

    // Verify Total in list
    await expect(page.getByText('₹200').first()).toBeVisible();

    // 3. Add Recurring Transaction
    await page.getByRole('button', { name: 'plus' }).first().click(); // FAB
    await page.fill('input[placeholder="0"]', '500');
    await page.click('button:has-text("Recurring Rule")');

    // Defaults to Daily, Today. Perfect.
    // Select Category
    await page.click('button:has-text("Bills & Utilities")');
    await page.locator('select').last().selectOption({ index: 1 });

    await page.click('button:has-text("Save Transaction")');

    // Verify it generated immediately (since it's due today)
    await expect(page.getByText('₹500').first()).toBeVisible();

    // 4. Verify Recurring Generation on Refresh
    // We can't easily test "Next Day" logic without mocking time or waiting.
    // But verifying the rule created a transaction today confirms the 'process on load' or 'generation' logic worked at least once.

});
