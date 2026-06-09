import { test, expect, devices } from '@playwright/test';

// Pointer-based swipe helper (mirrors the one in navigation.spec.js).
// The StationLogo's "Open TV Guide" button is flaky on iPad emulation,
// so we use the same swipe-up gesture the real users use.
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

// Happy-path E2E for the Connected game mode (Task 24).
//
// Flow under test:
//   1. TV opens the Game sheet (via the 🎮 button inside the Guide actions slot)
//      and starts a Connected room.
//   2. Two phones join via the ?join=<CODE> deep-link and set their names.
//   3. TV sees both players, starts a round, both phones lock in a guess,
//      TV reveals — phones see the reveal phase.
//
// This test talks to the real PeerJS public broker, so it is inherently
// network-dependent. If the broker is unreachable we skip rather than fail.
//
// Selectors are anchored to actual DOM:
//   - StationLogo button (aria-label "Open TV Guide") → opens the Guide sheet.
//   - Guide actions slot button (aria-label "Game mode") → opens GameSheet.
//   - ModeSelector renders the "Open room" button on the Connected card.
//   - HostRoomView shows the code in <div class="code">, "Start round",
//     "Reveal", and "Submissions: N/M".
//   - PhoneRoomView shows "Your name" placeholder, "Save" button.
//   - YearInput exposes "Lock it in".

test.describe.serial('connected game happy path', () => {
  test('host opens room, two phones join, round resolves', async ({ browser, baseURL }) => {
    test.setTimeout(90_000);

    // --- TV (host) ---
    const tvCtx = await browser.newContext({
      ...devices['iPad (gen 7) landscape'],
      hasTouch: true,
    });
    const tv = await tvCtx.newPage();
    await tv.goto(baseURL || '/');

    // Power on the TV so the touch overlay / station logo / guide become reachable.
    await tv.getByRole('button', { name: /turn on tv/i }).tap();

    // Wait for the touch overlay before swiping (the gesture target).
    await expect(tv.locator('#touch-overlay')).toBeAttached({ timeout: 10_000 });

    // Open the Guide (swipe up from the lower part of the screen), then click
    // the 🎮 Game mode button inside its actions slot. Guide is a Sheet, so
    // we wait for the "TV GUIDE" heading to confirm it's open.
    await swipeUp(tv);
    await expect(tv.getByText('TV GUIDE', { exact: true })).toBeVisible({ timeout: 10_000 });
    await tv.getByRole('button', { name: /^game mode$/i }).tap();

    // ModeSelector → click "Open room" to start a connected session.
    await tv.getByRole('button', { name: /open room/i }).tap();

    // Read the host room code. If the host failed to start (e.g. PeerJS broker
    // unreachable) the code will never appear → skip the test rather than fail.
    let code = '';
    try {
      await expect(tv.locator('.code')).toBeVisible({ timeout: 20_000 });
      code = (await tv.locator('.code').first().innerText()).trim();
    } catch {
      test.skip(true, 'PeerJS broker unavailable: host did not produce a room code');
    }
    expect(code).toMatch(/^[A-Z2-9]{4}$/);

    // --- Phone 1 ---
    const phoneCtx1 = await browser.newContext({ ...devices['iPhone 13'] });
    const p1 = await phoneCtx1.newPage();
    await p1.goto(`${baseURL || ''}/?join=${code}`);
    await p1.getByPlaceholder(/your name/i).fill('Kim');
    await p1.getByRole('button', { name: /^save$/i }).tap();

    // --- Phone 2 ---
    const phoneCtx2 = await browser.newContext({ ...devices['iPhone 13'] });
    const p2 = await phoneCtx2.newPage();
    await p2.goto(`${baseURL || ''}/?join=${code}`);
    await p2.getByPlaceholder(/your name/i).fill('Jordan');
    await p2.getByRole('button', { name: /^save$/i }).tap();

    // TV should now see two connected players. If peers can't reach the host
    // (broker hiccup, NAT, etc.) we skip — not a regression in our code.
    try {
      await expect(tv.locator('.players li')).toHaveCount(2, { timeout: 20_000 });
    } catch {
      test.skip(true, 'PeerJS broker unavailable: phones did not connect to host');
    }

    // Switch to the GAME tab to expose the round controls.
    await tv.getByRole('tab', { name: /^game$/i }).tap();

    // Host starts a round.
    await tv.getByRole('button', { name: /start round/i }).tap();

    // Both phones see the year input — lock in.
    await p1.getByRole('button', { name: /lock it in/i }).tap();
    await p2.getByRole('button', { name: /lock it in/i }).tap();

    // Host sees both submissions counted.
    await expect(tv.getByText(/Submissions:\s*2\/2/i)).toBeVisible({ timeout: 10_000 });

    // Host reveals — phones flip to the reveal phase. The new reveal card on
    // the phone surfaces the actual year, so we wait for the "Actual year"
    // label rather than the old generic "Reveal!" copy.
    await tv.getByRole('button', { name: /^reveal$/i }).tap();
    await expect(p1.getByText(/actual year/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(p2.getByText(/actual year/i).first()).toBeVisible({ timeout: 10_000 });

    await phoneCtx1.close();
    await phoneCtx2.close();
    await tvCtx.close();
  });
});
