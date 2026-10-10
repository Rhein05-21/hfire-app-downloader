// HFire Client App Script

document.addEventListener('DOMContentLoaded', () => {
  let appConfig = null;
  let qrCodeInstance = null;

  // Initialize
  fetchConfig();
  setupEventListeners();

  async function fetchConfig() {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      appConfig = await res.json();
      renderConfig(appConfig);
    } catch (err) {
      console.error('Error loading app config:', err);
      showToast('Could not load latest app details. Using default values.', 'error');
    }
  }

  function renderConfig(cfg) {
    const userApp = cfg.userApp || {};
    const adminApp = cfg.adminApp || {};

    // Basic text bindings
    document.querySelectorAll('[data-bind="appName"]').forEach(el => el.textContent = cfg.appName || 'HFire');
    document.querySelectorAll('[data-bind="tagline"]').forEach(el => el.textContent = cfg.tagline || '');
    document.querySelectorAll('[data-bind="description"]').forEach(el => el.textContent = cfg.description || '');

    // User App bindings
    document.querySelectorAll('[data-bind="userAppVersion"]').forEach(el => el.textContent = `v${userApp.version || '1.0.0'}`);
    document.querySelectorAll('[data-bind="userAppSize"]').forEach(el => el.textContent = userApp.fileSize || '18.5 MB');

    // Admin App bindings
    document.querySelectorAll('[data-bind="adminAppVersion"]').forEach(el => el.textContent = `v${adminApp.version || '1.0.0'}`);
    document.querySelectorAll('[data-bind="adminAppSize"]').forEach(el => el.textContent = adminApp.fileSize || '12.0 MB');

    // Legacy fallbacks if present
    document.querySelectorAll('[data-bind="version"]').forEach(el => el.textContent = `v${userApp.version || cfg.version || '1.0.0'}`);
    document.querySelectorAll('[data-bind="fileSize"]').forEach(el => el.textContent = userApp.fileSize || cfg.fileSize || '18.5 MB');
    document.querySelectorAll('[data-bind="releaseDate"]').forEach(el => el.textContent = userApp.releaseDate || cfg.releaseDate || 'October 2026');
    document.querySelectorAll('[data-bind="minAndroid"]').forEach(el => el.textContent = userApp.minAndroid || cfg.minAndroid || 'Android 5.0+');

    // Document title
    document.title = `${cfg.appName || 'HFire'} - Download Official APKs`;
  }

  function setupEventListeners() {
    // User App Download Button
    const downloadUserBtn = document.getElementById('download-user-btn');
    if (downloadUserBtn) {
      downloadUserBtn.addEventListener('click', () => {
        handleDownloadTrigger('user');
      });
    }

    // Admin App Download Button
    const downloadAdminBtn = document.getElementById('download-admin-btn');
    if (downloadAdminBtn) {
      downloadAdminBtn.addEventListener('click', () => {
        handleDownloadTrigger('admin');
      });
    }

    // Secondary Nav Download Button
    const navDownloadBtn = document.getElementById('nav-download-btn');
    if (navDownloadBtn) {
      navDownloadBtn.addEventListener('click', () => {
        handleDownloadTrigger('user');
      });
    }

    // QR Code Modal Triggers
    const closeQrBtn = document.getElementById('close-qr-btn');
    const qrModal = document.getElementById('qr-modal');
    const qrBackdrop = document.getElementById('qr-backdrop');

    document.querySelectorAll('.open-qr-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-qr-target') || 'user';
        generateAndShowQr(target);
        if (qrModal) {
          qrModal.classList.remove('hidden');
          qrModal.classList.add('flex');
        }
      });
    });

    const closeQr = () => {
      if (qrModal) {
        qrModal.classList.add('hidden');
        qrModal.classList.remove('flex');
      }
    };

    if (closeQrBtn) closeQrBtn.addEventListener('click', closeQr);
    if (qrBackdrop) qrBackdrop.addEventListener('click', closeQr);
  }

  function handleDownloadTrigger(target = 'user') {
    const isUser = target === 'user';
    const appObj = isUser ? (appConfig?.userApp || {}) : (appConfig?.adminApp || {});
    const appName = isUser ? 'HFire App' : 'HFire Admin';
    const fileName = appObj.apkFileName || (isUser ? 'HFire-v1.0.0.apk' : 'HFire-Admin-v1.0.0.apk');

    const banner = document.getElementById('safety-notice-banner');
    if (banner) {
      banner.classList.remove('hidden');
      banner.classList.add('flex');
    }

    showToast(`Downloading ${appName}... Check your browser downloads.`, 'success');

    // Trigger download
    const downloadUrl = `/download?app=${target}&t=${Date.now()}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function generateAndShowQr(target = 'user') {
    const qrContainer = document.getElementById('qrcode-canvas-container');
    const qrTitle = document.getElementById('qr-modal-title');
    if (!qrContainer) return;

    const isUser = target === 'user';
    if (qrTitle) {
      qrTitle.textContent = isUser ? 'HFire User App' : 'HFire Admin App';
    }

    qrContainer.innerHTML = '';
    const fullDownloadUrl = `${window.location.origin}/download?app=${target}`;

    try {
      if (typeof QRCode !== 'undefined') {
        qrCodeInstance = new QRCode(qrContainer, {
          text: fullDownloadUrl,
          width: 220,
          height: 220,
          colorDark: '#09090b',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } else {
        qrContainer.innerHTML = `<p class="text-zinc-400 text-xs">Direct Link: ${fullDownloadUrl}</p>`;
      }
    } catch (e) {
      console.error('QR code generation error:', e);
      qrContainer.innerHTML = `<p class="text-zinc-400 text-xs">Direct Link: ${fullDownloadUrl}</p>`;
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, 3500);
  }
});
