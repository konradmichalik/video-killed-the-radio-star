import { describe, it, expect } from 'vitest';
import { isIos, shouldOfferInstall } from '../src/lib/platform.js';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36';

describe('isIos', () => {
  it('detects iPhone/iPad user agents', () => {
    expect(isIos(IPHONE)).toBe(true);
    expect(isIos('… iPad …')).toBe(true);
  });

  it('detects iPadOS 13+ masquerading as Mac with touch', () => {
    expect(isIos('… Macintosh …', 5, 'MacIntel')).toBe(true);
    expect(isIos('… Macintosh …', 0, 'MacIntel')).toBe(false); // a real Mac
  });

  it('is false for Android / desktop', () => {
    expect(isIos(ANDROID)).toBe(false);
  });
});

describe('shouldOfferInstall', () => {
  it('offers on iOS Safari that is not standalone and not dismissed', () => {
    expect(shouldOfferInstall({ ua: IPHONE, standalone: false, dismissed: false })).toBe(true);
  });

  it('stays quiet when already installed, dismissed, or not iOS', () => {
    expect(shouldOfferInstall({ ua: IPHONE, standalone: true })).toBe(false);
    expect(shouldOfferInstall({ ua: IPHONE, dismissed: true })).toBe(false);
    expect(shouldOfferInstall({ ua: ANDROID })).toBe(false);
  });
});
