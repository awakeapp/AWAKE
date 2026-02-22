import { test, expect } from '@playwright/test';

test('Advanced Finance: Recurring & Split', async ({ page }) => {
    // 1. Signup/Login
    const timestamp = Date.now();
    const email = `adv${timestamp}@example.com`;
    const name = `Adv Verifier`;

    await page.goto('http://localhost:3000/AWAKE/login');
    await page.getByText('Create Account').click();
    await page.getByPlaceholder('Display Name').fill(name);
    await page.getByPlaceholder('Email address').fill(email);
    // Use an explicitly complex password that passes the new regex
    await page.getByPlaceholder('Password').fill('AwakeAdmin@2026!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForTimeout(2000); // give it a little time to process
    await page.screenshot({ path: 'tests/screenshot-after-signup.png' });
    
    await page.waitForURL('http://localhost:3000/AWAKE/', { timeout: 10000 });
    await page.goto('http://localhost:3000/AWAKE/finance');
    
    // Wait for the Finance page to load by expecting a key element (no networkidle due to Firebase)
    const addBtn = page.getByRole('button', { name: 'Add First Transaction' }).or(page.locator('button', { hasText: 'Create' })).or(page.locator('button:has(.lucide-plus)'));
    await expect(addBtn.first()).toBeVisible({ timeout: 20000 });

    // 2. Add Split Transaction
    await addBtn.first().click();
    await page.fill('input[placeholder="0"]', '200');

    // Toggle Split
    await page.click('button:has-text("Split Bill")', { force: true });

    // Add first split
    await page.locator('select').nth(0).selectOption({ index: 1 });
    await page.locator('input[placeholder="0"]').nth(1).fill('100'); // First split amount input (0 is main amount)

    // Add second split (click Add Split)
    await page.click('button:has-text("+ Add Split")', { force: true });
    await page.locator('select').nth(1).selectOption({ index: 2 });
    await page.locator('input[placeholder="0"]').nth(2).fill('100');

    // Select Account (last select)
    await page.locator('select').last().selectOption({ index: 1 });

    await page.click('button:has-text("Save Transaction")', { force: true });

    // Verify Total in list
    await expect(page.getByText('₹200').first()).toBeVisible();

    // 3. Add Recurring Transaction
    await page.getByRole('button', { name: 'plus' }).first().click({ force: true }); // FAB
    await page.fill('input[placeholder="0"]', '500');
    await page.click('button:has-text("Recurring Rule")', { force: true });

    // Defaults to Daily, Today. Perfect.
    // Select Category
    await page.locator('select').nth(0).selectOption({ index: 3 }); // replaced Bills & Utilities click with select which is accurate
    await page.locator('select').last().selectOption({ index: 1 });

    await page.click('button:has-text("Save Transaction")', { force: true });

    // Verify it generated immediately (since it's due today)
    await expect(page.getByText('₹500').first()).toBeVisible();

    // 4. Verify Recurring Generation on Refresh
    // We can't easily test "Next Day" logic without mocking time or waiting.
    // But verifying the rule created a transaction today confirms the 'process on load' or 'generation' logic worked at least once.

});
