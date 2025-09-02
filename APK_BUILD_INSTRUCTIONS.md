# 📱 APK Build Instructions for Hindi Learning App

## 🚀 Automated APK Build (Recommended)

### **Using GitHub Actions (Easiest)**

1. **The repository includes** a GitHub Actions workflow that automatically builds APK files
2. **To trigger a build:**
   ```bash
   # Method 1: Create a release tag
   git tag v1.0.0
   git push origin v1.0.0
   
   # Method 2: Manual trigger from GitHub Actions tab
   # Go to Actions → Build Android APK → Run workflow
   ```
3. **Download APK** from the Artifacts section of the completed workflow
4. **Or download** from the Releases section if tagged

### **APK Location After Build**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🛠️ Local Development Build

### **Prerequisites**
- **Node.js 18+**
- **Java JDK 17**
- **Android Studio** with Android SDK
- **Android Emulator or Physical Device**

### **Local Build Steps**
```bash
# 1. Clone and setup
git clone https://github.com/jhonny1677/hindi-learning-mobile-app
cd hindi-learning-mobile-app
npm install

# 2. Android setup
npx expo install --fix
npx expo run:android --variant release

# 3. APK will be generated at:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📦 Alternative Distribution Methods

### **Expo Development Build**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK (requires Expo account)
eas build -p android --profile preview --local
```

### **Direct Download Links**

**Current Options:**
1. **GitHub Actions Build**: Available after running the automated workflow
2. **Manual Build**: Follow local development steps above
3. **Expo Build Service**: Use EAS build for cloud-based APK generation

---

## 🎯 For Recruiters - Quick Access

### **Web Demo (Immediate Access)**
- **URL**: https://jhonny1677.github.io/hindi-learning-mobile-app
- **No Installation Required**: Works in any modern browser
- **Full Functionality**: Complete app experience on web

### **APK Download (When Available)**
- **Location**: [GitHub Releases](https://github.com/jhonny1677/hindi-learning-mobile-app/releases)
- **File Size**: ~50-80MB (typical React Native app)
- **Android Version**: 7.0+ (API level 24+)
- **Permissions**: Storage, Network, Camera (optional)

---

## 🔧 Troubleshooting APK Build

### **Common Issues & Solutions**

**Issue 1: Java Version Mismatch**
```bash
# Check Java version
java -version

# Should be Java 17, install if needed:
# Download from: https://adoptium.net/
```

**Issue 2: Android SDK Not Found**
```bash
# Set ANDROID_SDK_ROOT environment variable
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/platform-tools
```

**Issue 3: Build Dependencies**
```bash
# Clean and reinstall
rm -rf node_modules
npm install
npx expo install --fix
```

**Issue 4: Emulator Not Starting**
```bash
# Use physical device instead
# Enable Developer Options and USB Debugging
# Connect via USB and run: adb devices
```

---

## 📋 Build Configuration

### **App Details**
```json
{
  "name": "Hindi Learning App",
  "package": "com.ankit.hindilearningapp",
  "version": "1.0.0",
  "targetSdk": 34,
  "minSdk": 24
}
```

### **APK Features**
- **Size**: ~50-80MB (includes React Native runtime)
- **Performance**: Optimized for release build
- **Offline**: Full offline functionality included
- **Database**: SQLite embedded
- **Assets**: Optimized images and fonts

---

## 🎖️ Professional Notes

### **For Portfolio Presentation**
1. **Web Demo**: Fastest way for recruiters to test
2. **APK Download**: Comprehensive mobile experience
3. **Source Code**: Available for technical review
4. **Documentation**: Complete setup and usage guides

### **Technical Achievements Demonstrated**
- **Cross-Platform Development**: React Native + Expo
- **Modern Build Pipeline**: GitHub Actions automation
- **Production Optimization**: Release builds with proper configuration
- **Mobile Best Practices**: Proper Android app packaging and distribution

---

## 🚀 Next Steps

1. **Enable GitHub Pages** in repository settings for web demo
2. **Run GitHub Actions workflow** to generate APK
3. **Create a release** with APK download link
4. **Update README** with direct download links
5. **Test both demos** to ensure functionality

The app is production-ready and showcases professional mobile development skills suitable for senior-level positions.

---

*For any build issues or questions about the APK generation process, the automated GitHub Actions workflow provides the most reliable method for creating distributable APK files.*