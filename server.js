const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, 'config', 'app-config.json');
const DOWNLOADS_DIR = path.join(__dirname, 'public', 'downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read config
function readConfig() {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(data);
    // Ensure both userApp and adminApp structures exist
    if (!parsed.userApp) {
      parsed.userApp = {
        name: 'HFire App',
        version: parsed.version || '1.0.0',
        fileSize: parsed.fileSize || '18.5 MB',
        apkFileName: parsed.apkFileName || 'HFire-v1.0.0.apk',
        downloadUrl: '/download?app=user',
        sha256: parsed.sha256 || ''
      };
    }
    if (!parsed.adminApp) {
      parsed.adminApp = {
        name: 'HFire Admin',
        version: '1.0.0',
        fileSize: '12.0 MB',
        apkFileName: 'HFire-Admin-v1.0.0.apk',
        downloadUrl: '/download?app=admin',
        sha256: ''
      };
    }
    return parsed;
  } catch (err) {
    console.error('Error reading config:', err);
    return {
      appName: 'HFire',
      adminPassword: 'admin',
      userApp: {
        name: 'HFire App',
        version: '1.0.0',
        fileSize: '18.5 MB',
        apkFileName: 'HFire-v1.0.0.apk',
        downloadUrl: '/download?app=user',
        sha256: ''
      },
      adminApp: {
        name: 'HFire Admin',
        version: '1.0.0',
        fileSize: '12.0 MB',
        apkFileName: 'HFire-Admin-v1.0.0.apk',
        downloadUrl: '/download?app=admin',
        sha256: ''
      }
    };
  }
}

// Helper to write config
function writeConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

// Simple auth check middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const config = readConfig();
  const token = authHeader ? authHeader.replace(/^Bearer\s+/, '') : '';

  if (token && token === (config.adminPassword || 'admin')) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Invalid password' });
}

// Configure Multer for APK uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, DOWNLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const config = readConfig();
    const targetApp = (req.body && req.body.targetApp) === 'admin' ? 'admin' : 'user';
    const activeObj = targetApp === 'admin' ? config.adminApp : config.userApp;
    const version = (req.body && req.body.version) || (activeObj && activeObj.version) || '1.0.0';
    const cleanVersion = version.replace(/[^a-zA-Z0-9._-]/g, '');
    const prefix = targetApp === 'admin' ? 'HFire-Admin' : 'HFire';
    const finalName = `${prefix}-v${cleanVersion}.apk`;
    cb(null, finalName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.apk') {
      return cb(new Error('Only .apk files are permitted.'));
    }
    cb(null, true);
  }
});

// Route: Get Public App Config (password removed)
app.get('/api/config', (req, res) => {
  const config = readConfig();
  const publicConfig = { ...config };
  delete publicConfig.adminPassword;
  res.json(publicConfig);
});

// Route: Admin Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const config = readConfig();
  if (password === (config.adminPassword || 'admin')) {
    return res.json({ success: true, token: config.adminPassword || 'admin' });
  }
  return res.status(401).json({ success: false, error: 'Incorrect password' });
});

// Route: Update App Metadata
app.post('/api/config', requireAdmin, (req, res) => {
  try {
    const currentConfig = readConfig();
    const updates = req.body;

    if (updates.appName) currentConfig.appName = updates.appName;
    if (updates.tagline) currentConfig.tagline = updates.tagline;
    if (updates.description) currentConfig.description = updates.description;

    // Update User App details
    if (updates.userApp) {
      currentConfig.userApp = {
        ...currentConfig.userApp,
        ...updates.userApp
      };
    }

    // Update Admin App details
    if (updates.adminApp) {
      currentConfig.adminApp = {
        ...currentConfig.adminApp,
        ...updates.adminApp
      };
    }

    // Password change
    if (updates.newPassword && updates.newPassword.trim().length > 0) {
      currentConfig.adminPassword = updates.newPassword.trim();
    }

    writeConfig(currentConfig);
    const publicConfig = { ...currentConfig };
    delete publicConfig.adminPassword;
    return res.json({ success: true, config: publicConfig });
  } catch (err) {
    console.error('Error updating config:', err);
    return res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Route: Upload new APK
app.post('/api/upload', requireAdmin, (req, res) => {
  upload.single('apkFile')(req, res, function (err) {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message || 'Error uploading file' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No APK file uploaded' });
    }

    try {
      const targetApp = (req.body && req.body.targetApp) === 'admin' ? 'admin' : 'user';
      const filePath = req.file.path;
      const fileBytes = fs.readFileSync(filePath);
      const sha256 = crypto.createHash('sha256').update(fileBytes).digest('hex');
      const sizeInMB = (req.file.size / (1024 * 1024)).toFixed(1) + ' MB';

      const config = readConfig();
      const appKey = targetApp === 'admin' ? 'adminApp' : 'userApp';
      if (!config[appKey]) config[appKey] = {};

      config[appKey].apkFileName = req.file.filename;
      config[appKey].fileSize = sizeInMB;
      config[appKey].sha256 = sha256;
      if (req.body.version) {
        config[appKey].version = req.body.version;
      }
      if (req.body.releaseDate) {
        config[appKey].releaseDate = req.body.releaseDate;
      }

      writeConfig(config);

      const publicConfig = { ...config };
      delete publicConfig.adminPassword;

      return res.json({
        success: true,
        message: `${targetApp === 'admin' ? 'HFire Admin' : 'HFire User'} APK uploaded successfully!`,
        targetApp: targetApp,
        fileName: req.file.filename,
        fileSize: sizeInMB,
        sha256: sha256,
        config: publicConfig
      });
    } catch (processErr) {
      console.error('Post-upload processing error:', processErr);
      return res.status(500).json({ error: 'Failed to process uploaded APK' });
    }
  });
});

// Route: Direct APK Download for both User and Admin App
app.get(['/download', '/download/:appType'], (req, res) => {
  const config = readConfig();
  const appType = req.params.appType || req.query.app;
  const isAdminApp = appType === 'admin';
  const targetObj = isAdminApp ? (config.adminApp || {}) : (config.userApp || config);

  // If an external download URL is configured (e.g., GitHub Releases, Cloudflare R2), redirect directly
  if (targetObj.downloadUrl && targetObj.downloadUrl.startsWith('http')) {
    return res.redirect(targetObj.downloadUrl);
  }

  const defaultFile = isAdminApp ? 'HFire-Admin-v1.0.3.apk' : 'HFire-v1.0.0.apk';
  const fileName = targetObj.apkFileName || defaultFile;
  const filePath = path.join(DOWNLOADS_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.endsWith('.apk'));
    if (files.length > 0) {
      return sendApkFile(res, path.join(DOWNLOADS_DIR, files[0]), files[0]);
    }
    return res.status(404).send('APK file not found on server. Please upload via Admin portal.');
  }

  sendApkFile(res, filePath, fileName);
});

function sendApkFile(res, filePath, fileName) {
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=600');

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('File send error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error delivering APK file.');
      }
    }
  });
}

// Route: Admin Page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Route: Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🔥 HFire App Downloader is live!`);
  console.log(`🚀 Public Site: http://localhost:${PORT}`);
  console.log(`⚙️ Admin Portal: http://localhost:${PORT}/admin`);
  console.log(`===============================================`);
});
