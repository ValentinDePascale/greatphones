/* ========== COOKIE CONSENT MANAGER ========== */

const COOKIE_KEY = 'cookie_consent';

function initCookieConsent() {
  const consent = Storage.get(COOKIE_KEY);
  if (!consent) {
    showCookieBanner();
  } else {
    loadTrackingScripts();
  }
}

function showCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    setTimeout(() => banner.classList.add('show'), 500);
  }
}

function hideCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    banner.classList.remove('show');
    setTimeout(() => banner.style.display = 'none', 400);
  }
}

function showCookieModal() {
  hideCookieBanner();
  const modal = document.getElementById('cookieModal');
  if (modal) {
    const saved = Storage.get(COOKIE_KEY);
    if (saved) {
      document.getElementById('cookieAnalytics').checked = saved.analytics;
      document.getElementById('cookieMarketing').checked = saved.marketing;
    }
    setTimeout(() => modal.classList.add('show'), 10);
  }
}

function hideCookieModal() {
  const modal = document.getElementById('cookieModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function acceptAllCookies() {
  const prefs = { analytics: true, marketing: true };
  savePreferences(prefs);
}

function rejectNonEssential() {
  const prefs = { analytics: false, marketing: false };
  savePreferences(prefs);
}

function saveCookiePreferences() {
  const prefs = {
    analytics: document.getElementById('cookieAnalytics').checked,
    marketing: document.getElementById('cookieMarketing').checked
  };
  savePreferences(prefs);
}

function savePreferences(prefs) {
  Storage.set(COOKIE_KEY, prefs);
  hideCookieBanner();
  hideCookieModal();
  loadTrackingScripts();
}

function loadTrackingScripts() {
  const consent = Storage.get(COOKIE_KEY);
  if (!consent) return;

  if (consent.analytics) {
    const GA_ID = 'G-DXBP3J79WS';
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID, 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  if (consent.marketing) {
    loadScript('https://connect.facebook.net/en_US/fbevents.js', 'https://connect.facebook.net/en_US/fbevents.js');
  }
}

function loadScript(src, crossOrigin) {
  if (document.querySelector(`script[src="${src}"]`)) return;

  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  if (crossOrigin) script.crossOrigin = crossOrigin;
  document.head.appendChild(script);
}