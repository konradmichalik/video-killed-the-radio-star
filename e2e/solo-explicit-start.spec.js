import { test, expect } from '@playwright/test';

// Pointer-based swipe helper (same as connected-game-happy-path.spec.js).
// The StationLogo "Open TV Guide" button is flaky on iPad emulation, so we
// open the Guide with the same swipe-up gesture real users do.
async function swipeUp(page) {
  const vp = page.viewportSize();
  if (!vp) return;
  await page.evaluate(
    ([f, t]) => {
      const el = document.getElementById('touch-overlay');
      if (!el) return;
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
    [
      { x: vp.width / 2, y: vp.height * 0.7 },
      { x: vp.width / 2, y: vp.height * 0.2 },
    ],
  );
}

// E2E for the Solo game mode (Task 26).
//
// Flow under test:
//   1. Power on TV → open Guide → tap "Game mode" toolbar button.
//   2. ModeSelector → tap "Start" on the Solo card.
//   3. GameSheet's Solo shell shows "Start round" → tap it.
//   4. Phase becomes 'guessing' → tap "Reveal".
//   5. Phase becomes 'revealed' → tap "Year ✓" self-rate (fires
//      nextGuessStats writeback to the guessStats store).
//   6. Tap "Next round" → shell returns to idle and "Start round"
//      is visible again.
//
// Solo mode does NOT use peer.js — no broker dependency.
test('solo game starts from GameSheet, round → reveal → rate → next', async ({ page, baseURL }) => {
  test.setTimeout(60_000);

  await page.goto(baseURL || '/');

  // Power on the TV so the touch overlay / guide become reachable.
  await page.getByRole('button', { name: /turn on tv/i }).tap();
  await expect(page.locator('#touch-overlay')).toBeAttached({ timeout: 10_000 });

  // Open the Guide via swipe-up, then tap the 🎮 Game mode toolbar button.
  await swipeUp(page);
  await expect(page.getByText('TV GUIDE', { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /^game mode$/i }).tap();

  // ModeSelector → "Start" on the Solo card.
  await page.getByRole('button', { name: /^start$/i }).tap();

  // Solo shell → Start round.
  await page.getByRole('button', { name: /start round/i }).tap();

  // Reveal.
  await page.getByRole('button', { name: /^reveal$/i }).tap();

  // Self-rate: "Year ✓" — this triggers nextGuessStats(s, true).
  await page.getByRole('button', { name: /year ✓/i }).tap();

  // Next round → returns to idle, "Start round" visible again.
  await page.getByRole('button', { name: /next round/i }).tap();
  await expect(page.getByRole('button', { name: /start round/i })).toBeVisible({ timeout: 5_000 });
});
