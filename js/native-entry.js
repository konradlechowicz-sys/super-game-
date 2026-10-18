// Entry point for the iOS app build only (bundled by scripts/build.mjs).
// Exposes the Capacitor plugins on window.__native before the game boots.
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';

window.__native = Capacitor.isNativePlatform() ? { Haptics, ImpactStyle, NotificationType, Preferences } : null;
