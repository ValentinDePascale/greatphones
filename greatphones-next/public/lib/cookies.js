/* ========== COOKIE CONSENT MANAGER ========== */

const COOKIE_KEY = 'gp_cookie_consent';

function initCookieConsent() {
  const consent = localStorage.getItem(COOKIE_KEY);
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
    const saved = localStorage.getItem(COOKIE_KEY);
    if (saved) {
      const prefs = JSON.parse(saved);
      document.getElementById('cookieAnalytics').checked = prefs.analytics;
      document.getElementById('cookieMarketing').checked = prefs.marketing;
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
  localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs));
  hideCookieBanner();
  hideCookieModal();
  loadTrackingScripts();
}

function loadTrackingScripts() {
  const consent = localStorage.getItem(COOKIE_KEY);
  if (!consent) return;

  const prefs = JSON.parse(consent);

  if (prefs.analytics) {
    loadScript('https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX', 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX');
  }

  if (prefs.marketing) {
    loadScript('https://connect.facebook.net/en_US/fbevents.js', 'https://connect.facebook.net/en_US/fbevents.js');
  }
}

function loadScript(src, crossOrigin) {
  if (document.querySelector(`script[src="${src}"]`)) return;

  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}