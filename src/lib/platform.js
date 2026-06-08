// Pure platform checks (no browser globals) so they can be unit-tested.

/** iOS includes iPadOS 13+, which reports as "MacIntel" with a touch screen. */
export function isIos(ua = '', maxTouchPoints = 0, platform = '') {
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (platform === 'MacIntel' && maxTouchPoints > 1) return true;
  return false;
}

/** Offer "Add to Home Screen" only on iOS, when not already installed/standalone. */
export function shouldOfferInstall({
  ua = '',
  platform = '',
  maxTouchPoints = 0,
  standalone = false,
  dismissed = false,
} = {}) {
  return isIos(ua, maxTouchPoints, platform) && !standalone && !dismissed;
}
