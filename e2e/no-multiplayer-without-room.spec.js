import { test, expect } from '@playwright/test';

test('app does not contact peerjs broker on initial load', async ({ page, baseURL }) => {
  const peerJsRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('peerjs.com')) peerJsRequests.push(req.url());
  });
  await page.goto(baseURL);
  await page.waitForTimeout(2500);
  expect(peerJsRequests).toEqual([]);
});
