import { Platform, Linking } from 'react-native';

export const APP_CONFIG = {
  appName: 'Meat Up',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=app.rork.meatup.delivery',
  apkFileName: 'MeatUp.apk',
  // Can be a local path served from public/ directory, or a cloud URL (Firebase Storage / S3 / GitHub Releases)
  apkDownloadUrl: '/downloads/MeatUp.apk',
};

/**
 * Triggers direct download of the APK file
 */
export function downloadApk(customUrl?: string, filename: string = APP_CONFIG.apkFileName): boolean {
  try {
    const url = customUrl || APP_CONFIG.apkDownloadUrl;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.setAttribute('download', filename);
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      return true;
    } else {
      Linking.openURL(url).catch((err) => {
        console.warn('Failed to open APK URL:', err);
      });
      return true;
    }
  } catch (error) {
    console.error('Error initiating APK download:', error);
    return false;
  }
}

/**
 * Opens Google Play Store link in a new tab or store application
 */
export function openPlayStore(customUrl?: string): void {
  try {
    const url = customUrl || APP_CONFIG.playStoreUrl;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch((err) => {
        console.warn('Failed to open Play Store URL:', err);
      });
    }
  } catch (error) {
    console.error('Error opening Play Store link:', error);
  }
}
