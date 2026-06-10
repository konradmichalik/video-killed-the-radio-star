import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { installPromptEvent } from './lib/stores.js';

const app = mount(App, { target: document.body });

// Capture Chrome's PWA install prompt so the InstallHint can offer a real
// "Install" button on Android. The event fires once per page load when the
// site meets the install criteria; we preventDefault so Chrome doesn't show
// its own mini-infobar and instead let the user trigger .prompt() on click.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPromptEvent.set(e);
});
// Clear the captured event once the app is actually installed so the hint
// goes away even if the user never tapped Dismiss.
window.addEventListener('appinstalled', () => {
  installPromptEvent.set(null);
});

// When a new service worker takes control (i.e. a deploy happened while the
// user had the app open), reload so the page picks up the new HTML + JS bundle
// instead of running the old code against new precache. Guarded by an existing
// controller so the very first install doesn't immediately reload itself.
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });
}

export default app;
