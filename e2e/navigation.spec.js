import { test, expect } from '@playwright/test';

// A touch-screen swipe helper (Playwright's touchscreen.tap is single-point,
// so we drive raw touch events for swipes).
async function swipe(page, from, to) {
  await page.evaluate(
    ([f, t]) => {
      const el = document.getElementById('touch-overlay');
      const fire = (type, x, y) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 1,
            isPrimary: true,
            clientX: x,
            clientY: y,
            bubbles: true,
          }),
        );
      fire('pointerdown', f.x, f.y);
      fire('pointerup', t.x, t.y);
    },
    [from, to],
  );
}

test('start screen renders and turns the TV on', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('TURN ON TV')).toBeVisible();
  await page.getByRole('button', { name: /turn on tv/i }).tap();
  // start screen should be gone, the touch overlay should now exist
  await expect(page.locator('#touch-overlay')).toBeAttached();
});

test('swipe up opens the TV Guide', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /turn on tv/i }).tap();
  const { width, height } = page.viewportSize();
  await swipe(page, { x: width / 2, y: height * 0.7 }, { x: width / 2, y: height * 0.2 });
  await expect(page.locator('#guide.open')).toBeVisible();
  await expect(page.getByText('TV GUIDE')).toBeVisible();
});

test('tap on the guide backdrop closes it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /turn on tv/i }).tap();
  await page.getByRole('button', { name: /open tv guide/i }).tap();
  await expect(page.locator('#guide.open')).toBeVisible();
  // tap the dimmed backdrop near the top, outside the bottom sheet
  await page.mouse.click(20, 20);
  await expect(page.locator('#guide.open')).toHaveCount(0);
});
