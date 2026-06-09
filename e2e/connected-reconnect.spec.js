import { test, expect, devices } from '@playwright/test';

// Pointer-based swipe helper (mirrors connected-game-happy-path.spec.js).
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

// Reconnect E2E for the Connected game mode (Task 25).
//
// Flow under test:
//   1. TV opens a Connected room.
//   2. A phone joins with ?join=<CODE> and sets its name to "Kim".
//   3. TV sees exactly 1 player.
//   4. Phone closes its tab and reopens the same join URL in the SAME
//      BrowserContext so localStorage (vktrs:player) persists.
//   5. loadOrCreate returns the persisted identity → name is pre-filled,
//      TV still shows exactly 1 player (slot reclaimed, not duplicated).
//
// Like Task 24 this depends on the real PeerJS public broker — if the
// broker is down we skip rather than fail.

test.describe.serial('connected reconnect', () => {
  test('phone reconnects with same playerId, identity preserved', async ({ browser, baseURL }) => {
    test.setTimeout(90_000);

    // --- TV (host) ---
    const tvCtx = await browser.newContext({
      ...devices['iPad (gen 7) landscape'],
      hasTouch: true,
    });
    const tv = await tvCtx.newPage();
    await tv.goto(baseURL || '/');

    await tv.getByRole('button', { name: /turn on tv/i }).tap();
    await expect(tv.locator('#touch-overlay')).toBeAttached({ timeout: 10_000 });

    await swipeUp(tv);
    await expect(tv.getByText('TV GUIDE', { exact: true })).toBeVisible({ timeout: 10_000 });
    await tv.getByRole('button', { name: /^game mode$/i }).tap();
    await tv.getByRole('button', { name: /open room/i }).tap();

    let code = '';
    try {
      await expect(tv.locator('.code')).toBeVisible({ timeout: 20_000 });
      code = (await tv.locator('.code').first().innerText()).trim();
    } catch {
      test.skip(true, 'PeerJS broker unavailable: host did not produce a room code');
    }
    expect(code).toMatch(/^[A-Z2-9]{4}$/);

    // --- Phone (persistent context so localStorage survives page close) ---
    const phoneCtx = await browser.newContext({ ...devices['iPhone 13'] });
    const p = await phoneCtx.newPage();
    await p.goto(`${baseURL || ''}/?join=${code}`);
    await p.getByPlaceholder(/your name/i).fill('Kim');
    await p.getByRole('button', { name: /^save$/i }).tap();

    // TV should now see one connected player.
    try {
      await expect(tv.locator('.players li')).toHaveCount(1, { timeout: 20_000 });
    } catch {
      test.skip(true, 'PeerJS broker unavailable: phone did not connect to host');
    }

    // Close the tab and reopen with the same join URL in the same context.
    // Same BrowserContext means localStorage (vktrs:player) survives.
    await p.close();

    const p2 = await phoneCtx.newPage();
    await p2.goto(`${baseURL || ''}/?join=${code}`);

    // After reconnect:
    //   - loadOrCreate returns the persisted identity → no name input,
    //     the "You: Kim" header renders (header <strong>).
    //   - No name input is shown (we're not in editing mode).
    //   - TV still shows exactly 1 player (same player.id reclaimed,
    //     no duplicate slot).
    await expect(p2.locator('header strong', { hasText: 'Kim' })).toBeVisible({ timeout: 15_000 });
    await expect(p2.getByPlaceholder(/your name/i)).toHaveCount(0);
    await expect(tv.locator('.players li')).toHaveCount(1, { timeout: 15_000 });

    await phoneCtx.close();
    await tvCtx.close();
  });
});
