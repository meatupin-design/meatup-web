import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Download, Check, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { APP_CONFIG, downloadApk, openPlayStore } from '@/constants/appLinks';

interface AppDownloadSectionProps {
  playStoreUrl?: string;
  apkDownloadUrl?: string;
  compact?: boolean;
}

// Crisp Google Play vector icon
function GooglePlayIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.6 1.8C3.2 2.2 3 2.8 3 3.6v16.8c0 .8.2 1.4.6 1.8l.1.1 9.4-9.4v-.4L3.7 3.1l-.1-.1z"
        fill="#00D2FF"
      />
      <Path
        d="M16.8 15.6l-3.7-3.7v-.4l3.7-3.7.1.1 4.4 2.5c1.2.7 1.2 1.8 0 2.5l-4.5 2.7z"
        fill="#FFCE00"
      />
      <Path
        d="M16.9 15.5l-3.8-3.8-9.5 9.5c.5.5 1.3.6 2.2.1l11.1-6.3.0.5z"
        fill="#FF334B"
      />
      <Path
        d="M16.9 8.5L5.8 2.2C4.9 1.7 4.1 1.8 3.6 2.3l9.5 9.5 3.8-3.3z"
        fill="#00E676"
      />
    </Svg>
  );
}

export default function AppDownloadSection({
  playStoreUrl = APP_CONFIG.playStoreUrl,
  apkDownloadUrl = APP_CONFIG.apkDownloadUrl,
  compact = false,
}: AppDownloadSectionProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const isDesktop = windowWidth >= 1024;
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadApk = () => {
    const success = downloadApk(apkDownloadUrl);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    }
  };

  const handleOpenPlayStore = () => {
    openPlayStore(playStoreUrl);
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <LinearGradient
        colors={['#50020a', '#74111B', '#380206']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, compact && styles.compactCard]}
      >
        {/* Glow decoration behind */}
        <View style={styles.glowCircle} />

        <View style={styles.contentRow}>
          {/* Left Column: Info & perks */}
          <View style={styles.infoCol}>

            <Text style={styles.title}>
              Order Fresh Meat Anywhere, Anytime
            </Text>
            <Text style={styles.subtitle}>
              Get the best experience on mobile with live market updates, instant order tracking, and exclusive discounts.
            </Text>
          </View>

          {/* Right Column: Download Actions */}
          <View style={[styles.actionsCol, isTablet && styles.actionsColTablet]}>
            <Text style={styles.actionsHeading}>Choose your install method:</Text>

            {/* 1. Google Play Store Button */}
            <TouchableOpacity
              style={styles.storeButton}
              onPress={handleOpenPlayStore}
              activeOpacity={0.85}
            >
              <View style={styles.storeIconWrapper}>
                <GooglePlayIcon size={26} />
              </View>
              <View style={styles.storeButtonTextContainer}>
                <Text style={styles.storeButtonSub}>AVAILABLE ON</Text>
                <Text style={styles.storeButtonTitle}>Google Play</Text>
              </View>
              <ExternalLink size={16} color={Colors.cream} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            {/* 2. Download APK Button */}
            <TouchableOpacity
              style={[styles.apkButton, downloadSuccess && styles.apkButtonSuccess]}
              onPress={handleDownloadApk}
              activeOpacity={0.85}
            >
              <View style={[styles.apkIconWrapper, downloadSuccess && styles.apkIconWrapperSuccess]}>
                {downloadSuccess ? (
                  <Check size={20} color="#00E676" />
                ) : (
                  <Download size={20} color={Colors.deepTeal} />
                )}
              </View>
              <View style={styles.storeButtonTextContainer}>
                <Text style={styles.apkButtonSub}>
                  {downloadSuccess ? 'DOWNLOADING STARTED' : 'DIRECT INSTALL'}
                </Text>
                <Text style={styles.apkButtonTitle}>
                  {downloadSuccess ? 'Check Downloads' : 'Download APK'}
                </Text>
              </View>
              <View style={styles.apkBadge}>
                <Text style={styles.apkBadgeText}>.APK</Text>
              </View>
            </TouchableOpacity>

            {downloadSuccess && (
              <View style={styles.downloadFeedback}>
                <Check size={13} color="#00E676" />
                <Text style={styles.downloadFeedbackText}>
                  MeatUp.apk download started! Tap file to install.
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  compactContainer: {
    paddingHorizontal: 0,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(99, 2, 12, 0.35)',
      },
      default: {
        elevation: 8,
        shadowColor: '#63020c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
    }),
  },
  compactCard: {
    padding: 18,
    borderRadius: 18,
  },
  glowCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 194, 194, 0.08)',
  },
  contentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  infoCol: {
    flex: 1,
    minWidth: 260,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(253, 248, 228, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(253, 248, 228, 0.25)',
  },
  badgePillText: {
    color: Colors.cream,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 254, 239, 0.85)',
    lineHeight: 19,
    marginBottom: 16,
  },
  perksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  perkText: {
    color: Colors.cream,
    fontSize: 11,
    fontWeight: '600',
  },
  actionsCol: {
    width: '100%',
    minWidth: 260,
    maxWidth: 360,
    gap: 12,
  },
  actionsColTablet: {
    width: 320,
  },
  actionsHeading: {
    color: Colors.priceNeutral,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  storeIconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeButtonTextContainer: {
    justifyContent: 'center',
  },
  storeButtonSub: {
    color: '#aaa',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  storeButtonTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  apkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.creamLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  apkButtonSuccess: {
    backgroundColor: '#1b3a24',
    borderColor: '#00E676',
  },
  apkIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 2, 12, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  apkIconWrapperSuccess: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  apkButtonSub: {
    color: Colors.deepTeal,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  apkButtonTitle: {
    color: Colors.charcoal,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  apkBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.deepTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  apkBadgeText: {
    color: Colors.cream,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  downloadFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    marginTop: 2,
  },
  downloadFeedbackText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
});
