import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

const app = mount(App, { target: document.body });

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
