import { test, expect } from '@playwright/test';

test('Vehicle Logic: Add Vehicle, Follow-up, and Finance Integration', async ({ page }) => {
    // 1. Signup/Login
    const timestamp = Date.now();
    const email = `veh${timestamp}@example.com`;
    const name = `Vehicle Verifier`;

    await page.goto('http://localhost:3000/login');
    await page.getByText('Create Account').click();
    await page.getByPlaceholder('Display Name').fill(name);
    await page.getByPlaceholder('Email Address').fill(email);
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await page.waitForURL('http://localhost:3000/', { timeout: 15000 });

    // 2. Navigate to Vehicle Dashboard
    await page.goto('http://localhost:3000/vehicle');
    await page.waitForLoadState('networkidle');

    // 3. Add Vehicle
    const addVehBtn = page.getByRole('button', { name: 'Add First Vehicle' });
    if (await addVehBtn.isVisible()) {
        await addVehBtn.click();
    } else {
        await page.getByRole('button', { name: 'Add First Vehicle' }).click();
    }

    await page.waitForSelector('text=Add New Vehicle');

    // Modal: Vehicle Details
    await page.getByPlaceholder('e.g. My Red Racer').fill('Test Bike');
    await page.getByRole('button', { name: 'Bike' }).click();
    await page.getByPlaceholder('e.g. Honda City 2022').fill('Hero Splendor');

    // Odometer is the only number input in this modal
    await page.locator('input[type="number"]').fill('1000');



    // Submit
    await page.getByRole('button', { name: 'Add Vehicle' }).click();

    // Wait for modal to close
    await expect(page.locator('text=Add New Vehicle')).not.toBeVisible({ timeout: 10000 });

    // Verify Vehicle Card
    await expect(page.getByText('Test Bike', { exact: true })).toBeVisible();
    await expect(page.getByText('1,000 km', { exact: true })).toBeVisible();

    // 4. Add Follow-up
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await page.locator('select').first().selectOption('Custom');
    await page.getByPlaceholder('Enter custom event name').fill('Test Service');
    await page.locator('input[type="date"]').fill('2026-12-31');
    await page.getByRole('button', { name: 'Set Reminder' }).click();

    await expect(page.getByText('Test Service')).toBeVisible();

    // 5. Complete Follow-up
    // Find the card container (has shadow-sm class and text)
    const reminderItem = page.locator('.shadow-sm').filter({ hasText: 'Test Service' }).first();
    await page.waitForTimeout(500);
    await reminderItem.getByRole('button', { name: 'Done' }).click();

    // Modal: Cost, Odometer
    // Cost (number), Odometer (number). 
    // In Complete Modal, Odometer might be first?
    // CompleteFollowUpModal grid: Date, Odometer. Then Cost.
    // So inputs[0] is Date? No, date is type="date".
    // inputs[type="number"] 0 -> Odometer
    // inputs[type="number"] 1 -> Cost
    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill('1100'); // Odometer
    await inputs.nth(1).fill('500');  // Cost

    await page.waitForSelector('select', { timeout: 2000 });
    await page.locator('select').last().selectOption({ index: 0 });

    await page.click('button:has-text("Complete & Log")');

    // 6. Verify Updates
    await expect(page.getByText('1,100 km')).toBeVisible();

    // 7. Verify Finance
    await page.goto('http://localhost:3000/finance');
    await expect(page.getByText('₹500')).toBeVisible();
});
