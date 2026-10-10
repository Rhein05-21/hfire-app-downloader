# 🔥 HFire App Downloader & Uploader Portal

A fast, lightweight, and modern web application for downloading the **HFire Android APK**. Designed with a fiery **Orange & Black** theme, official branding, and an ultra-simple password-protected **Uploader Portal** to manage APK releases without touching code.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The site will run at **http://localhost:3000**

---

## 📱 URLs & Navigation

- **Public Download Portal**: [http://localhost:3000](http://localhost:3000)
- **HFire User App Download**: [http://localhost:3000/download?app=user](http://localhost:3000/download?app=user)
- **HFire Admin App Download**: [http://localhost:3000/download?app=admin](http://localhost:3000/download?app=admin)
- **Uploader / Admin Portal**: [http://localhost:3000/admin](http://localhost:3000/admin)
  - **Default Admin Password**: `admin` *(can be changed anytime in the admin dashboard)*

---

## ✨ Features

1. **Orange & Black Fiery Theme**: Glassmorphism cards, neon orange glow accents, and responsive layout for mobile, tablet, and desktop.
2. **Official Logo Integration**: Uses `h-fire_logo.png` across headers, hero showcase, and modals.
3. **Dual APK Downloaders**:
   - 🔥 **HFire App**: Official APK for end users (`HFire-v1.0.0.apk`)
   - ⚡ **HFire Admin App**: Official companion APK for administrators (`HFire-Admin-v1.0.0.apk`)
4. **Drag & Drop APK Uploader**: Upload either User or Admin APKs directly in `/admin`; automatically calculates file size and SHA-256 integrity hash.
5. **Mobile QR Code Generator**: Offline dynamic QR code modal for instant phone or TV camera scanning for both apps.


---

## 🛡️ Critical Android & APK Errors Prevented

- **MIME-Type Renaming (`.apk` to `.zip`)**: Servers configured to enforce `Content-Type: application/vnd.android.package-archive` and `Content-Disposition: attachment; filename="HFire.apk"`.
- **Incomplete / Corrupted Downloads (Parse Error)**: Built-in `Accept-Ranges: bytes` support handles interrupted mobile networks with resumable downloads.
- **Chrome Security Warning ("File might be harmful")**: Built-in visual prompt clarifies that this is standard Android security caution for side-loaded APKs.
- **Stale Caching**: Automatic cache invalidation ensures visitors always get the latest uploaded APK.

---

## 📁 Project Structure

```
HFire App downloader/
├── config/
│   └── app-config.json         # Active version, specs & password
├── public/
│   ├── assets/
│   │   └── h-fire_logo.png     # Official HFire logo
│   ├── downloads/
│   │   └── HFire-v1.0.0.apk    # Stored APK binaries
│   ├── css/
│   │   └── custom.css          # Orange & Black glow theme
│   ├── js/
│   │   ├── app.js              # Public site dynamic bindings & QR
│   │   ├── admin.js            # Uploader login & file upload logic
│   │   └── qrcode.min.js       # Offline QR code generator
│   ├── index.html              # Public download landing page
│   └── admin.html              # Uploader admin dashboard
├── server.js                   # Node.js Express server & APK streaming
├── package.json
└── README.md
```
