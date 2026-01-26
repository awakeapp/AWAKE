import { test, expect } from '@playwright/test';

test('Transaction Flow: Add, Edit, Delete, Undo', async ({ page }) => {
    // 1. Signup to get a fresh session
    const timestamp = Date.now();
    const email = `verify${timestamp}@example.com`;
    const name = `Verifier ${timestamp}`;
    const password = 'password123';

    await page.goto('http://localhost:3000/login');
    await page.getByText('Create Account').click();
    await page.getByPlaceholder('Display Name').fill(name);
    await page.getByPlaceholder('Email Address').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });

    // 2. Navigate to Finance Dashboard
    await page.goto('http://localhost:3000/finance');
    await page.waitForLoadState('networkidle');

    // Verify we are on Finance Dashboard
    await expect(page.getByText('Total Net Balance')).toBeVisible({ timeout: 10000 });

    // 3. Add Transaction
    // Check for FAB or "Add First Transaction"
    const addBtn = page.getByRole('button', { name: 'Add First Transaction' }).or(page.locator('button:has(.lucide-plus)'));
    await addBtn.click();

    // Verify Modal Open
    await expect(page.getByText('Add Transaction', { exact: true })).toBeVisible();

    // Fill Form
    await page.fill('input[placeholder="0"]', '100');

    // Select Category (click a chip)
    await page.getByRole('button', { name: 'Food & Dining' }).click();

    // Select Account
    await page.selectOption('select:has-text("Account")', { index: 1 });

    // Save
    await page.getByRole('button', { name: 'Save Transaction' }).click();

    // Verify Modal Closed
    await expect(page.getByText('Add Transaction', { exact: true })).not.toBeVisible();

    // Verify Transaction in List
    await expect(page.getByText('₹100').first()).toBeVisible();

    // 4. Edit Transaction
    await page.getByText('₹100').first().click();

    // Verify Edit Modal
    await expect(page.getByText('Edit Transaction')).toBeVisible();

    // Change Amount
    await page.fill('input[placeholder="0"]', '200');

    // Save Update
    await page.getByRole('button', { name: 'Update Transaction' }).click();

    // Verify Update
    await expect(page.getByText('₹200').first()).toBeVisible();
    await expect(page.getByText('₹100')).not.toBeVisible();

    // 5. Delete Transaction
    await page.getByText('₹200').first().click(); // Re-open
    // Accept confirm dialog
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    // Verify logic
    await expect(page.getByText('₹200')).not.toBeVisible();

    // 6. Verify Undo Toast
    const undoToast = page.getByText('Transaction deleted.');
    await expect(undoToast).toBeVisible();

    // Click Undo
    await page.getByRole('button', { name: 'Undo' }).click();

    // Verify Restored
    await expect(page.getByText('₹200').first()).toBeVisible();
});
