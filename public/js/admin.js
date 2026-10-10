// HFire Admin & Uploader Script

document.addEventListener('DOMContentLoaded', () => {
  let authToken = localStorage.getItem('hfire_admin_token') || '';

  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('login-form');
  const passwordInput = document.getElementById('password-input');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  // Form Elements
  const metadataForm = document.getElementById('metadata-form');
  const appNameInput = document.getElementById('appName');
  const descriptionInput = document.getElementById('description');
  const userAppVersionInput = document.getElementById('userAppVersion');
  const userAppFileSizeInput = document.getElementById('userAppFileSize');
  const userAppReleaseDateInput = document.getElementById('userAppReleaseDate');
  const adminAppVersionInput = document.getElementById('adminAppVersion');
  const adminAppFileSizeInput = document.getElementById('adminAppFileSize');
  const adminAppReleaseDateInput = document.getElementById('adminAppReleaseDate');
  const newPasswordInput = document.getElementById('newPassword');

  // Upload Elements
  const targetAppSelect = document.getElementById('target-app-select');
  const dropTargetHint = document.getElementById('drop-target-hint');
  const userActiveFile = document.getElementById('user-active-file');
  const adminActiveFile = document.getElementById('admin-active-file');
  const dropZone = document.getElementById('drop-zone');
  const apkFileInput = document.getElementById('apk-file-input');
  const uploadProgress = document.getElementById('upload-progress');
  const uploadProgressBar = document.getElementById('upload-progress-bar');
  const uploadPercent = document.getElementById('upload-percent');
  const uploadStatus = document.getElementById('upload-status');

  // Check initial auth state
  if (authToken) {
    showDashboard();
  } else {
    showLogin();
  }

  // Handle Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const password = passwordInput.value.trim();

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        authToken = data.token;
        localStorage.setItem('hfire_admin_token', authToken);
        passwordInput.value = '';
        showDashboard();
        showToast('Login successful! Welcome back.', 'success');
      } else {
        loginError.textContent = data.error || 'Incorrect password.';
        loginError.classList.remove('hidden');
      }
    } catch (err) {
      loginError.textContent = 'Network error while attempting login.';
      loginError.classList.remove('hidden');
    }
  });

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authToken = '';
      localStorage.removeItem('hfire_admin_token');
      showLogin();
      showToast('Logged out successfully.', 'info');
    });
  }

  function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
  }

  function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    loadConfigData();
  }

  // Target app switcher hint
  if (targetAppSelect && dropTargetHint) {
    targetAppSelect.addEventListener('change', () => {
      const isUser = targetAppSelect.value === 'user';
      dropTargetHint.textContent = `Uploading to: ${isUser ? 'HFire App (User APK)' : 'HFire Admin App (Admin APK)'}`;
    });
  }

  // Fetch current config and populate fields
  async function loadConfigData() {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Failed to load config');
      const cfg = await res.json();

      const userApp = cfg.userApp || {};
      const adminApp = cfg.adminApp || {};

      appNameInput.value = cfg.appName || 'HFire';
      descriptionInput.value = cfg.description || '';

      // User App
      userAppVersionInput.value = userApp.version || '1.0.0';
      userAppFileSizeInput.value = userApp.fileSize || '18.5 MB';
      userAppReleaseDateInput.value = userApp.releaseDate || 'October 2026';
      if (userActiveFile) userActiveFile.textContent = userApp.apkFileName || 'None';

      // Admin App
      adminAppVersionInput.value = adminApp.version || '1.0.0';
      adminAppFileSizeInput.value = adminApp.fileSize || '12.0 MB';
      adminAppReleaseDateInput.value = adminApp.releaseDate || 'October 2026';
      if (adminActiveFile) adminActiveFile.textContent = adminApp.apkFileName || 'None';
    } catch (err) {
      console.error(err);
      showToast('Error loading configuration.', 'error');
    }
  }

  // Handle Metadata Form Save
  metadataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      appName: appNameInput.value.trim(),
      description: descriptionInput.value.trim(),
      userApp: {
        version: userAppVersionInput.value.trim(),
        fileSize: userAppFileSizeInput.value.trim(),
        releaseDate: userAppReleaseDateInput.value.trim()
      },
      adminApp: {
        version: adminAppVersionInput.value.trim(),
        fileSize: adminAppFileSizeInput.value.trim(),
        releaseDate: adminAppReleaseDateInput.value.trim()
      }
    };

    if (newPasswordInput.value.trim().length > 0) {
      payload.newPassword = newPasswordInput.value.trim();
    }

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (payload.newPassword) {
          authToken = payload.newPassword;
          localStorage.setItem('hfire_admin_token', authToken);
          newPasswordInput.value = '';
        }
        showToast('Settings published successfully!', 'success');
        loadConfigData();
      } else {
        if (res.status === 401) {
          showToast('Session expired. Please log in again.', 'error');
          showLogin();
        } else {
          showToast(data.error || 'Failed to update settings.', 'error');
        }
      }
    } catch (err) {
      showToast('Error saving settings.', 'error');
    }
  });

  // Drag & Drop Setup
  if (dropZone && apkFileInput) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('border-orange-500', 'bg-orange-500/10');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-orange-500', 'bg-orange-500/10');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    });

    dropZone.addEventListener('click', () => {
      apkFileInput.click();
    });

    apkFileInput.addEventListener('change', () => {
      if (apkFileInput.files.length > 0) {
        handleFileUpload(apkFileInput.files[0]);
      }
    });
  }

  // Handle File Upload via XHR for real progress
  function handleFileUpload(file) {
    if (!file.name.toLowerCase().endsWith('.apk')) {
      showToast('Please select a valid .apk file!', 'error');
      return;
    }

    const targetApp = targetAppSelect ? targetAppSelect.value : 'user';
    const isUser = targetApp === 'user';
    const versionVal = isUser ? userAppVersionInput.value.trim() : adminAppVersionInput.value.trim();
    const releaseDateVal = isUser ? userAppReleaseDateInput.value.trim() : adminAppReleaseDateInput.value.trim();

    const formData = new FormData();
    formData.append('apkFile', file);
    formData.append('targetApp', targetApp);
    formData.append('version', versionVal || '1.0.0');
    formData.append('releaseDate', releaseDateVal || '');

    uploadProgress.classList.remove('hidden');
    uploadProgressBar.style.width = '0%';
    uploadPercent.textContent = '0%';
    uploadStatus.textContent = `Uploading ${file.name} to ${isUser ? 'HFire App' : 'HFire Admin'}...`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        uploadProgressBar.style.width = `${percent}%`;
        uploadPercent.textContent = `${percent}%`;
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          uploadStatus.textContent = 'Upload complete! Processing APK...';
          uploadProgressBar.style.width = '100%';
          uploadPercent.textContent = '100%';

          setTimeout(() => {
            uploadProgress.classList.add('hidden');
            showToast(`${isUser ? 'HFire User App' : 'HFire Admin App'} APK uploaded & published!`, 'success');
            loadConfigData();
          }, 800);
        } catch (e) {
          uploadStatus.textContent = 'Server response parse error.';
        }
      } else if (xhr.status === 401) {
        showToast('Unauthorized. Please log in again.', 'error');
        showLogin();
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          uploadStatus.textContent = `Error: ${res.error || 'Upload failed'}`;
        } catch {
          uploadStatus.textContent = 'Upload failed. Check server logs.';
        }
      }
    };

    xhr.onerror = () => {
      uploadStatus.textContent = 'Connection error during upload.';
      showToast('Upload failed due to connection error.', 'error');
    };

    xhr.send(formData);
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('admin-toast');
    const toastMsg = document.getElementById('admin-toast-message');
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
