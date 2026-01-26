
import { test, expect } from '@playwright/test';

test('verify settings update and logout flow', async ({ page }) => {
    // 1. Signup to get a fresh session
    const timestamp = Date.now();
    const email = `verify${timestamp}@example.com`;
    const name = `Verifier ${timestamp}`;
    const password = 'password123';

    console.log(`Creating user for verification: ${email}`);

    await page.goto('http://localhost:3000/login');
    await page.getByText('Create Account').click();
    await page.getByPlaceholder('Display Name').fill(name);
    await page.getByPlaceholder('Email Address').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });

    // 2. Navigate to Settings
    // Assuming there is a way to get there, but for now we force navigate to check the page itself
    await page.goto('http://localhost:3000/settings');
    await expect(page.getByText('Security')).toBeVisible();

    // 3. Edit Name
    const newName = `Updated ${timestamp}`;
    // Click edit button (pencil icon) - usually inside the group
    // The code shows: <button onClick={() => setIsEditingName(true)} ...> <Edit2 ... /> </button>
    // It's hidden until hover, but we can force click or use keyboard if needed, or just locator
    // But wait, the code shows: isEditingName ? input : h2 + button

    // We might need to hover first to make the button visible/interactive if it relies on group-hover
    // But Playwright can click invisible elements with force: true if needed, or we just target the button.
    // The button has <Edit2 size={16} /> inside.

    // Hover over the group to ensure button is interactable
    await page.getByText(name).first().hover();

    // Click edit button using reliable testId
    await page.getByTestId('edit-name-btn').click({ force: true });

    // 4. Fill new name
    await page.getByTestId('name-input').fill(newName);

    // 5. Save (Check icon)
    await page.getByTestId('save-name-btn').click();

    // 6. Verify update
    await expect(page.getByText(newName)).toBeVisible();

    // 7. Test Logout
    await page.getByText('Log Out').click();

    // 8. Verify Redirect to Login
    await page.waitForURL('http://localhost:3000/login', { timeout: 5000 });
    await expect(page.getByText('Sign In')).toBeVisible();
});
